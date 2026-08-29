--!strict
-- Server-authoritative bullet simulation: raycast stepping, gravity, bounces,
-- homing, explosions. Damage itself is applied by hooks provided by Main.

local RunService = game:GetService("RunService")
local Debris = game:GetService("Debris")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)

type Stats = Config.Stats

export type Hooks = {
	-- Is this character's block window active right now?
	isBlocking: (character: Model) -> boolean,
	-- A bullet connected with a character (direct hit).
	onCharacterHit: (shooter: Player, victimChar: Model, pos: Vector3, stats: Stats, velocity: Vector3) -> (),
	-- A bullet died with an explosion radius (AoE damage lives in Main).
	onExplode: (shooter: Player, pos: Vector3, stats: Stats) -> (),
	-- Root part of the shooter's current enemy (for homing), or nil.
	getEnemyRoot: (shooter: Player) -> BasePart?,
}

type Bullet = {
	part: BasePart,
	pos: Vector3,
	vel: Vector3,
	bouncesLeft: number,
	shooter: Player,
	stats: Stats,
	born: number,
}

local MAX_LIFETIME = 6

local Projectiles = {}

local hooks: Hooks
local active: { Bullet } = {}
local folder = Instance.new("Folder")
folder.Name = "Projectiles"
folder.Parent = workspace

local function poof(pos: Vector3, size: number, color: Color3)
	local p = Instance.new("Part")
	p.Shape = Enum.PartType.Ball
	p.Material = Enum.Material.Neon
	p.Color = color
	p.Size = Vector3.one * size
	p.Position = pos
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.Transparency = 0.4
	p.Parent = folder
	Debris:AddItem(p, 0.15)
end

function Projectiles.init(h: Hooks)
	hooks = h
end

function Projectiles.clear()
	for _, b in active do
		b.part:Destroy()
	end
	table.clear(active)
end

-- Deletes bullets near a point that don't belong to `owner` (block clears bullets).
function Projectiles.destroyNear(pos: Vector3, radius: number, owner: Player)
	for i = #active, 1, -1 do
		local b = active[i]
		if b.shooter ~= owner and (b.pos - pos).Magnitude <= radius then
			poof(b.pos, 2, Color3.fromRGB(120, 200, 255))
			b.part:Destroy()
			table.remove(active, i)
		end
	end
end

function Projectiles.fire(shooter: Player, stats: Stats, origin: Vector3, dir: Vector3)
	dir = Vector3.new(dir.X, dir.Y, 0)
	if dir.Magnitude < 0.01 then
		dir = Vector3.xAxis
	end
	dir = dir.Unit

	-- Apply spread.
	if stats.spread > 0 then
		local angle = math.rad((math.random() - 0.5) * 2 * stats.spread)
		local cos, sin = math.cos(angle), math.sin(angle)
		dir = Vector3.new(dir.X * cos - dir.Y * sin, dir.X * sin + dir.Y * cos, 0)
	end

	local part = Instance.new("Part")
	part.Shape = Enum.PartType.Ball
	part.Material = Enum.Material.Neon
	part.Color = Color3.fromRGB(255, 196, 64)
	part.Size = Vector3.one * stats.bulletSize
	part.Position = origin
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Parent = folder

	table.insert(active, {
		part = part,
		pos = origin,
		vel = dir * stats.bulletSpeed,
		bouncesLeft = stats.bounces,
		shooter = shooter,
		stats = stats,
		born = os.clock(),
	})
end

local function killBullet(i: number, b: Bullet, hitPos: Vector3)
	if b.stats.explosionRadius > 0 then
		poof(hitPos, b.stats.explosionRadius * 2, Color3.fromRGB(255, 120, 40))
		hooks.onExplode(b.shooter, hitPos, b.stats)
	else
		poof(hitPos, 1.2, Color3.fromRGB(255, 196, 64))
	end
	b.part:Destroy()
	table.remove(active, i)
end

RunService.Heartbeat:Connect(function(dt: number)
	if not hooks then
		return
	end
	local now = os.clock()

	for i = #active, 1, -1 do
		local b = active[i]
		if now - b.born > MAX_LIFETIME then
			b.part:Destroy()
			table.remove(active, i)
			continue
		end

		-- Gravity.
		b.vel -= Vector3.new(0, b.stats.bulletGravity * dt, 0)

		-- Homing: steer toward the enemy while keeping speed.
		local homing = b.stats.flags.homing
		if homing then
			local enemyRoot = hooks.getEnemyRoot(b.shooter)
			if enemyRoot then
				local toEnemy = (enemyRoot.Position - b.pos)
				toEnemy = Vector3.new(toEnemy.X, toEnemy.Y, 0)
				if toEnemy.Magnitude > 1 then
					local speed = b.vel.Magnitude
					b.vel = (b.vel + toEnemy.Unit * speed * homing * dt).Unit * speed
				end
			end
		end

		local step = b.vel * dt
		local params = RaycastParams.new()
		if b.stats.flags.phase then
			-- Phase rounds only collide with characters.
			local chars = {}
			for _, plr in game:GetService("Players"):GetPlayers() do
				if plr ~= b.shooter and plr.Character then
					table.insert(chars, plr.Character)
				end
			end
			params.FilterType = Enum.RaycastFilterType.Include
			params.FilterDescendantsInstances = chars
		else
			params.FilterType = Enum.RaycastFilterType.Exclude
			local shooterChar = b.shooter.Character
			params.FilterDescendantsInstances = { folder, shooterChar :: any }
		end

		local result = workspace:Raycast(b.pos, step, params)
		if result then
			local hitChar = result.Instance:FindFirstAncestorOfClass("Model")
			local humanoid = hitChar and hitChar:FindFirstChildOfClass("Humanoid")
			if hitChar and humanoid then
				if hooks.isBlocking(hitChar) then
					-- Shield eats the bullet.
					poof(result.Position, 2.5, Color3.fromRGB(120, 200, 255))
					b.part:Destroy()
					table.remove(active, i)
				else
					hooks.onCharacterHit(b.shooter, hitChar, result.Position, b.stats, b.vel)
					killBullet(i, b, result.Position)
				end
			elseif b.bouncesLeft > 0 then
				-- Ricochet off terrain.
				b.bouncesLeft -= 1
				local n = result.Normal
				b.vel = (b.vel - 2 * b.vel:Dot(n) * n) * 0.9
				b.pos = result.Position + n * 0.1
				b.part.Position = b.pos
			else
				killBullet(i, b, result.Position)
			end
		else
			b.pos += step
			b.part.Position = b.pos
			if b.pos.Y < Config.KILL_Y then
				b.part:Destroy()
				table.remove(active, i)
			end
		end
	end
end)

return Projectiles
