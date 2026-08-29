--!strict
-- The match director: pairs two fighters, runs rounds, hands the loser an
-- upgrade card, first to Config.WINS_TO_TAKE_MATCH takes the match.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local Config = require(ReplicatedStorage.Shared.Config)
local Maps = require(ReplicatedStorage.Shared.Maps)
local Upgrades = require(ReplicatedStorage.Shared.Upgrades)
local MapBuilder = require(script.Parent.MapBuilder)
local PlayerStats = require(script.Parent.PlayerStats)
local Projectiles = require(script.Parent.Projectiles)

Players.CharacterAutoLoads = false

-- ============================================================ Remotes

local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
remotes.Parent = ReplicatedStorage

local gameEvent = Instance.new("RemoteEvent") -- server -> client
gameEvent.Name = "GameEvent"
gameEvent.Parent = remotes

local playerAction = Instance.new("RemoteEvent") -- client -> server
playerAction.Name = "PlayerAction"
playerAction.Parent = remotes

local function broadcast(kind: string, ...)
	gameEvent:FireAllClients(kind, ...)
end

-- ============================================================ Per-fighter combat state

type CombatState = {
	ammo: number,
	reloading: boolean,
	lastShot: number,
	blockReadyAt: number,
	blockUntil: number,
	secondWindUsed: boolean,
	inRound: boolean,
}

local combat: { [Player]: CombatState } = {}
local fighters: { Player } = {} -- the two players currently in the match
local roundLoser: Player? = nil
local matchAborted = false
local pendingOffer: { [Player]: { ids: { [string]: boolean }, chosen: string? } } = {}

local function isFighter(player: Player): boolean
	return table.find(fighters, player) ~= nil
end

local function enemyOf(player: Player): Player?
	for _, f in fighters do
		if f ~= player then
			return f
		end
	end
	return nil
end

local function freshCombat(player: Player): CombatState
	local s = PlayerStats.get(player)
	local state = {
		ammo = s.ammo,
		reloading = false,
		lastShot = 0,
		blockReadyAt = 0,
		blockUntil = 0,
		secondWindUsed = false,
		inRound = false,
	}
	combat[player] = state
	return state
end

local function sendAmmo(player: Player)
	local state = combat[player]
	local s = PlayerStats.get(player)
	if state then
		gameEvent:FireClient(player, "ammo", state.ammo, s.ammo, state.reloading, s.reloadTime)
	end
end

local function sendStats(player: Player)
	local s = PlayerStats.get(player)
	gameEvent:FireClient(player, "stats", {
		jumps = s.jumps,
		fireRate = s.fireRate,
		blockCooldown = s.blockCooldown,
	})
end

local function broadcastScores(wins: { [Player]: number }?)
	local payload = {}
	for _, f in fighters do
		table.insert(payload, {
			name = f.DisplayName,
			wins = wins and wins[f] or 0,
			upgrades = #PlayerStats.getUpgradeNames(f),
		})
	end
	broadcast("scores", payload, Config.WINS_TO_TAKE_MATCH)
end

-- ============================================================ Health bars

local function attachHealthBar(player: Player, character: Model)
	local head = character:WaitForChild("Head", 5)
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not head or not humanoid then
		return
	end

	local gui = Instance.new("BillboardGui")
	gui.Name = "HealthBar"
	gui.Size = UDim2.fromScale(6, 1.4)
	gui.StudsOffset = Vector3.new(0, 2.6, 0)
	gui.AlwaysOnTop = true
	gui.Adornee = head

	local nameLabel = Instance.new("TextLabel")
	nameLabel.Size = UDim2.fromScale(1, 0.5)
	nameLabel.BackgroundTransparency = 1
	nameLabel.Text = player.DisplayName
	nameLabel.TextColor3 = Color3.new(1, 1, 1)
	nameLabel.TextStrokeTransparency = 0.4
	nameLabel.TextScaled = true
	nameLabel.Font = Enum.Font.GothamBold
	nameLabel.Parent = gui

	local barBack = Instance.new("Frame")
	barBack.Position = UDim2.fromScale(0, 0.55)
	barBack.Size = UDim2.fromScale(1, 0.3)
	barBack.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
	barBack.BorderSizePixel = 0
	barBack.Parent = gui

	local bar = Instance.new("Frame")
	bar.Size = UDim2.fromScale(1, 1)
	bar.BackgroundColor3 = Color3.fromRGB(90, 220, 90)
	bar.BorderSizePixel = 0
	bar.Parent = barBack

	local function update()
		local frac = math.clamp(humanoid.Health / math.max(humanoid.MaxHealth, 1), 0, 1)
		bar.Size = UDim2.fromScale(frac, 1)
		bar.BackgroundColor3 = frac > 0.5 and Color3.fromRGB(90, 220, 90)
			or frac > 0.25 and Color3.fromRGB(235, 200, 60)
			or Color3.fromRGB(230, 70, 70)
	end
	humanoid.HealthChanged:Connect(update)
	update()

	gui.Parent = character
end

-- ============================================================ Damage

local function takeDamage(victim: Player, amount: number, attacker: Player?, fromThorns: boolean?)
	local char = victim.Character
	local humanoid = char and char:FindFirstChildOfClass("Humanoid")
	if not char or not humanoid or humanoid.Health <= 0 then
		return
	end

	local vs = PlayerStats.get(victim)
	amount *= vs.damageTakenMult

	-- Second Wind: cheat death once per round.
	local state = combat[victim]
	if vs.flags.secondWind and state and not state.secondWindUsed and humanoid.Health - amount <= 0 then
		state.secondWindUsed = true
		humanoid.Health = 1
		broadcast("message", victim.DisplayName .. " cheated death!", 1.5)
	else
		humanoid:TakeDamage(amount)
	end

	-- Adrenaline: brief speed surge when hurt.
	if vs.flags.adrenaline then
		humanoid.WalkSpeed = vs.moveSpeed * 1.5
		task.delay(2, function()
			if victim.Character == char and humanoid.Health > 0 then
				humanoid.WalkSpeed = vs.moveSpeed
			end
		end)
	end

	if attacker and not fromThorns then
		-- Thorns: reflect a cut of the damage.
		local thorns = vs.flags.thorns
		if thorns then
			takeDamage(attacker, amount * thorns, victim, true)
		end
		-- Lifesteal for the attacker.
		local as = PlayerStats.get(attacker)
		if as.lifesteal > 0 then
			local aChar = attacker.Character
			local aHum = aChar and aChar:FindFirstChildOfClass("Humanoid")
			if aHum and aHum.Health > 0 then
				aHum.Health = math.min(aHum.Health + amount * as.lifesteal, aHum.MaxHealth)
			end
		end
	end
end

-- ============================================================ Projectile hooks

Projectiles.init({
	isBlocking = function(character)
		local player = Players:GetPlayerFromCharacter(character)
		local state = player and combat[player]
		return (state and os.clock() < state.blockUntil) == true
	end,

	onCharacterHit = function(shooter, victimChar, pos, stats, velocity)
		local victim = Players:GetPlayerFromCharacter(victimChar)
		if not victim or victim == shooter then
			return
		end

		-- Knockback.
		local root = victimChar:FindFirstChild("HumanoidRootPart") :: BasePart?
		if root and velocity.Magnitude > 0 then
			local push = velocity.Unit * stats.knockback + Vector3.new(0, stats.knockback * 0.4, 0)
			root.AssemblyLinearVelocity += Vector3.new(push.X, push.Y, 0)
		end

		takeDamage(victim, stats.damage, shooter)

		-- Poison: damage over 5 seconds.
		local poison = stats.flags.poison
		if poison then
			task.spawn(function()
				local ticks = 10
				for _ = 1, ticks do
					task.wait(0.5)
					local hum = victimChar:FindFirstChildOfClass("Humanoid")
					if not hum or hum.Health <= 0 or victim.Character ~= victimChar then
						return
					end
					takeDamage(victim, poison / ticks, shooter)
				end
			end)
		end

		-- Chill: slow for 2 seconds.
		if stats.flags.chill then
			local hum = victimChar:FindFirstChildOfClass("Humanoid")
			if hum and hum.Health > 0 then
				local vs = PlayerStats.get(victim)
				hum.WalkSpeed = vs.moveSpeed * 0.6
				task.delay(2, function()
					if victim.Character == victimChar and hum.Health > 0 then
						hum.WalkSpeed = vs.moveSpeed
					end
				end)
			end
		end
	end,

	onExplode = function(shooter, pos, stats)
		for _, plr in Players:GetPlayers() do
			if plr == shooter then
				continue
			end
			local char = plr.Character
			local root = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
			if root then
				local dist = (root.Position - pos).Magnitude
				if dist <= stats.explosionRadius then
					local state = combat[plr]
					if state and os.clock() < state.blockUntil then
						continue -- shield blocks the blast
					end
					local falloff = 1 - 0.5 * (dist / stats.explosionRadius)
					takeDamage(plr, stats.damage * falloff, shooter)
					local away = (root.Position - pos)
					away = Vector3.new(away.X, math.max(away.Y, 2), 0)
					root.AssemblyLinearVelocity += away.Unit * stats.knockback * 1.5
				end
			end
		end
	end,

	getEnemyRoot = function(shooter)
		local enemy = enemyOf(shooter)
		local char = enemy and enemy.Character
		return char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
	end,
})

-- ============================================================ Player actions

local function handleFire(player: Player, aimPoint: any)
	if typeof(aimPoint) ~= "Vector3" or not isFighter(player) then
		return
	end
	-- Reject NaN/absurd aim points from exploiting clients.
	if aimPoint.X ~= aimPoint.X or aimPoint.Y ~= aimPoint.Y or aimPoint.Magnitude > 1e5 then
		return
	end
	local state = combat[player]
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
	local humanoid = char and char:FindFirstChildOfClass("Humanoid")
	if not state or not state.inRound or state.reloading or not root or not humanoid or humanoid.Health <= 0 then
		return
	end

	local s = PlayerStats.get(player)
	local now = os.clock()
	if now - state.lastShot < (1 / s.fireRate) * 0.9 then
		return
	end
	state.lastShot = now

	task.spawn(function()
		for shot = 1, s.burst do
			if combat[player] ~= state or state.ammo <= 0 or humanoid.Health <= 0 then
				break
			end
			local origin = root.Position
			local dir = Vector3.new(aimPoint.X - origin.X, aimPoint.Y - origin.Y, 0)
			if dir.Magnitude < 0.01 then
				dir = Vector3.xAxis
			end
			dir = dir.Unit
			for _ = 1, s.bulletCount do
				Projectiles.fire(player, s, origin + dir * 2 + Vector3.new(0, 0.5, 0), dir)
			end

			state.ammo -= 1
			sendAmmo(player)
			if state.ammo <= 0 then
				state.reloading = true
				sendAmmo(player)
				task.delay(s.reloadTime, function()
					if combat[player] == state then
						state.ammo = s.ammo
						state.reloading = false
						sendAmmo(player)
					end
				end)
				break
			end
			if shot < s.burst then
				task.wait(0.09)
			end
		end
	end)
end

local function handleBlock(player: Player)
	if not isFighter(player) then
		return
	end
	local state = combat[player]
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
	local humanoid = char and char:FindFirstChildOfClass("Humanoid")
	if not state or not state.inRound or not root or not humanoid or humanoid.Health <= 0 then
		return
	end

	local now = os.clock()
	if now < state.blockReadyAt then
		return
	end
	local s = PlayerStats.get(player)
	state.blockUntil = now + Config.BLOCK_DURATION
	state.blockReadyAt = now + Config.BLOCK_DURATION + s.blockCooldown
	gameEvent:FireClient(player, "blockCD", Config.BLOCK_DURATION + s.blockCooldown)

	-- Shield flash.
	local shield = Instance.new("Part")
	shield.Shape = Enum.PartType.Ball
	shield.Material = Enum.Material.ForceField
	shield.Color = Color3.fromRGB(120, 200, 255)
	shield.Size = Vector3.one * 9
	shield.CanCollide = false
	shield.CanQuery = false
	shield.Massless = true
	shield.CFrame = root.CFrame
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = shield
	weld.Part1 = root
	weld.Parent = shield
	shield.Parent = char
	Debris:AddItem(shield, Config.BLOCK_DURATION)

	-- Delete incoming bullets around you.
	Projectiles.destroyNear(root.Position, Config.BLOCK_CLEAR_RADIUS, player)

	-- Upgrade-granted block perks.
	local heal = s.flags.healBlock
	if heal then
		humanoid.Health = math.min(humanoid.Health + heal, humanoid.MaxHealth)
	end
	if s.flags.shockBlock then
		local enemy = enemyOf(player)
		local eChar = enemy and enemy.Character
		local eRoot = eChar and eChar:FindFirstChild("HumanoidRootPart") :: BasePart?
		if eRoot and (eRoot.Position - root.Position).Magnitude < 14 then
			local away = eRoot.Position - root.Position
			away = Vector3.new(away.X, math.max(away.Y, 3), 0)
			eRoot.AssemblyLinearVelocity += away.Unit * 80
		end
	end
end

playerAction.OnServerEvent:Connect(function(player, kind, ...)
	if kind == "fire" then
		handleFire(player, ...)
	elseif kind == "block" then
		handleBlock(player)
	elseif kind == "pick" then
		local id = ...
		local offer = pendingOffer[player]
		if offer and typeof(id) == "string" and offer.ids[id] and not offer.chosen then
			offer.chosen = id
		end
	end
end)

-- ============================================================ Spawning

local function spawnFighter(player: Player, pos: Vector3): Model?
	local ok = pcall(function()
		player:LoadCharacter()
	end)
	if not ok then
		return nil -- player disconnected mid-spawn
	end
	local char = player.Character or player.CharacterAdded:Wait()
	local root = char:WaitForChild("HumanoidRootPart", 5) :: BasePart?
	if not root then
		return nil
	end
	char:PivotTo(CFrame.new(pos))
	PlayerStats.applyToCharacter(player, char)
	attachHealthBar(player, char)
	freshCombat(player)
	sendStats(player)
	sendAmmo(player)
	return char
end

-- Kill plane + regen tick.
task.spawn(function()
	while true do
		task.wait(0.25)
		for _, f in fighters do
			local char = f.Character
			local root = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
			local humanoid = char and char:FindFirstChildOfClass("Humanoid")
			if root and humanoid and humanoid.Health > 0 then
				if root.Position.Y < Config.KILL_Y then
					humanoid.Health = 0
				else
					local s = PlayerStats.get(f)
					if s.regen > 0 then
						humanoid.Health = math.min(humanoid.Health + s.regen * 0.25, humanoid.MaxHealth)
					end
				end
			end
		end
	end
end)

-- ============================================================ Upgrade picking

local function offerUpgrade(loser: Player)
	local cards = Upgrades.roll(Config.UPGRADE_CHOICES)
	local payload = {}
	local ids: { [string]: boolean } = {}
	for _, c in cards do
		table.insert(payload, { id = c.id, name = c.name, desc = c.desc })
		ids[c.id] = true
	end
	local offer = { ids = ids, chosen = nil :: string? }
	pendingOffer[loser] = offer

	gameEvent:FireClient(loser, "offer", payload, Config.UPGRADE_PICK_TIME)
	local enemy = enemyOf(loser)
	if enemy then
		gameEvent:FireClient(enemy, "message", loser.DisplayName .. " is choosing an upgrade...", Config.UPGRADE_PICK_TIME)
	end

	local deadline = os.clock() + Config.UPGRADE_PICK_TIME
	while os.clock() < deadline and not offer.chosen and not matchAborted do
		task.wait(0.1)
	end

	local chosen = offer.chosen or cards[1].id
	pendingOffer[loser] = nil
	if loser.Parent then
		gameEvent:FireClient(loser, "offerClear")
	end

	if not matchAborted and loser.Parent then
		PlayerStats.applyUpgrade(loser, chosen)
		sendStats(loser)
		broadcast("message", loser.DisplayName .. " took " .. Upgrades.byId[chosen].name .. "!", 2)
	end
end

-- ============================================================ Match loop

local function runMatch(p1: Player, p2: Player)
	fighters = { p1, p2 }
	matchAborted = false
	local wins: { [Player]: number } = { [p1] = 0, [p2] = 0 }
	PlayerStats.reset(p1)
	PlayerStats.reset(p2)
	local mapIndex = math.random(#Maps)

	broadcast("message", p1.DisplayName .. " vs " .. p2.DisplayName .. " — first to " .. Config.WINS_TO_TAKE_MATCH .. "!", 3)
	broadcastScores(wins)
	task.wait(2)

	while not matchAborted do
		-- Build the next arena.
		mapIndex = mapIndex % #Maps + 1
		local _, spawns = MapBuilder.build(mapIndex)
		Projectiles.clear()
		broadcast("message", Maps[mapIndex].name, 2)

		local char1 = spawnFighter(p1, spawns[1])
		local char2 = spawnFighter(p2, spawns[2])
		if matchAborted or not char1 or not char2 then
			break
		end

		-- Countdown with fighters frozen in place.
		local roots = {}
		for _, c in { char1, char2 } do
			local r = c:FindFirstChild("HumanoidRootPart") :: BasePart?
			if r then
				r.Anchored = true
				table.insert(roots, r)
			end
		end
		for t = Config.COUNTDOWN_TIME, 1, -1 do
			broadcast("message", tostring(t), 1)
			task.wait(1)
		end
		broadcast("message", "FIGHT!", 1)
		for _, r in roots do
			r.Anchored = false
		end

		-- Arm combat and watch for a death.
		roundLoser = nil
		for _, f in fighters do
			local state = combat[f]
			if state then
				state.inRound = true
			end
			local char = f.Character
			local humanoid = char and char:FindFirstChildOfClass("Humanoid")
			if humanoid then
				humanoid.Died:Once(function()
					if not roundLoser then
						roundLoser = f
					end
				end)
			end
		end

		while not roundLoser and not matchAborted do
			task.wait(0.1)
		end
		if matchAborted then
			break
		end

		for _, f in fighters do
			local state = combat[f]
			if state then
				state.inRound = false
			end
		end

		local loser = roundLoser :: Player
		local winner = enemyOf(loser) :: Player
		wins[winner] += 1
		broadcastScores(wins)

		if wins[winner] >= Config.WINS_TO_TAKE_MATCH then
			broadcast("message", "🏆 " .. winner.DisplayName .. " WINS THE MATCH! 🏆", Config.MATCH_OVER_TIME)
			task.wait(Config.MATCH_OVER_TIME)
			break
		end

		broadcast("message", winner.DisplayName .. " takes the round!", 2)
		task.wait(Config.ROUND_INTERMISSION)
		offerUpgrade(loser)
	end

	-- Wind down.
	fighters = {}
	Projectiles.clear()
	for _, p in { p1, p2 } do
		if p.Parent then
			PlayerStats.reset(p)
			if p.Character then
				p.Character:Destroy()
			end
		end
	end
end

-- Director: waits for two players, runs matches back to back.
task.spawn(function()
	MapBuilder.build(1) -- something to look at while waiting
	while true do
		local pool = Players:GetPlayers()
		if #pool >= 2 then
			runMatch(pool[1], pool[2])
		else
			broadcast("message", "Waiting for a challenger...", 3)
			task.wait(3)
		end
		task.wait(1)
	end
end)

Players.PlayerAdded:Connect(function(player)
	PlayerStats.reset(player)
	gameEvent:FireClient(player, "message", "Waiting for the next match...", 3)
end)

Players.PlayerRemoving:Connect(function(player)
	if isFighter(player) then
		matchAborted = true
		broadcast("message", player.DisplayName .. " left — match over.", 3)
	end
	PlayerStats.remove(player)
	combat[player] = nil
	pendingOffer[player] = nil
end)
