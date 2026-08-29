--!strict
-- Client controller: locks the game to a 2D plane, runs the side-view camera,
-- handles aim/shoot/block/double-jump input, and draws the HUD + upgrade cards.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local gameEvent = remotes:WaitForChild("GameEvent") :: RemoteEvent
local playerAction = remotes:WaitForChild("PlayerAction") :: RemoteEvent

local camera = workspace.CurrentCamera

-- Stats the server syncs down so input can behave correctly.
local myStats = { jumps = 1, fireRate = 1.6, blockCooldown = 4 }

-- ============================================================ 2D plane lock + facing

local aimPoint = Vector3.new(10, 5, 0)

local function getRoot(): BasePart?
	local char = player.Character
	return char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
end

RunService.Heartbeat:Connect(function()
	local root = getRoot()
	if not root then
		return
	end
	-- Pin the character to the Z=0 plane.
	local p = root.Position
	if math.abs(p.Z) > 0.01 then
		root.CFrame -= Vector3.new(0, 0, p.Z)
	end
	local v = root.AssemblyLinearVelocity
	if v.Z ~= 0 then
		root.AssemblyLinearVelocity = Vector3.new(v.X, v.Y, 0)
	end
end)

-- Face toward the mouse (left/right only).
RunService.RenderStepped:Connect(function()
	local char = player.Character
	local root = getRoot()
	local humanoid = char and char:FindFirstChildOfClass("Humanoid")
	if not root or not humanoid or humanoid.Health <= 0 then
		return
	end
	humanoid.AutoRotate = false
	local facing = (aimPoint.X >= root.Position.X) and 1 or -1
	local pos = root.Position
	root.CFrame = CFrame.new(pos) * CFrame.Angles(0, math.rad(90) * facing, 0)
end)

-- ============================================================ Camera

camera.CameraType = Enum.CameraType.Scriptable

local camTarget = Vector3.new(0, 10, 0)
local camDist = 70

RunService.RenderStepped:Connect(function(dt)
	camera = workspace.CurrentCamera or camera
	camera.CameraType = Enum.CameraType.Scriptable

	-- Frame every live fighter; fall back to the map center.
	local points = {}
	for _, plr in Players:GetPlayers() do
		local char = plr.Character
		local root = char and char:FindFirstChild("HumanoidRootPart")
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if root and hum and hum.Health > 0 then
			table.insert(points, (root :: BasePart).Position)
		end
	end

	local target, dist
	if #points == 0 then
		target, dist = Vector3.new(0, 12, 0), 75
	elseif #points == 1 then
		target, dist = points[1] + Vector3.new(0, 3, 0), 55
	else
		local mid = (points[1] + points[2]) / 2 + Vector3.new(0, 3, 0)
		local sep = (points[1] - points[2]).Magnitude
		target, dist = mid, math.clamp(35 + sep * 0.65, 45, 95)
	end

	local alpha = 1 - math.exp(-6 * dt)
	camTarget = camTarget:Lerp(target, alpha)
	camDist += (dist - camDist) * alpha
	camera.CFrame = CFrame.lookAt(Vector3.new(camTarget.X, camTarget.Y, camDist), camTarget)
end)

-- Mouse position -> world point on the Z=0 plane.
local function updateAim()
	local mouse = UserInputService:GetMouseLocation()
	local ray = camera:ViewportPointToRay(mouse.X, mouse.Y)
	if math.abs(ray.Direction.Z) > 1e-4 then
		local t = -ray.Origin.Z / ray.Direction.Z
		if t > 0 then
			aimPoint = ray.Origin + ray.Direction * t
		end
	end
end
RunService.RenderStepped:Connect(updateAim)

-- ============================================================ HUD

local gui = Instance.new("ScreenGui")
gui.Name = "RoundsHUD"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Parent = player:WaitForChild("PlayerGui")

local function mkLabel(parent: Instance, props: { [string]: any }): TextLabel
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Font = Enum.Font.GothamBold
	l.TextColor3 = Color3.new(1, 1, 1)
	l.TextStrokeTransparency = 0.5
	for k, v in props do
		(l :: any)[k] = v
	end
	l.Parent = parent
	return l
end

-- Scoreboard (top center).
local scoreLabel = mkLabel(gui, {
	Name = "Score",
	Position = UDim2.new(0.5, 0, 0, 12),
	AnchorPoint = Vector2.new(0.5, 0),
	Size = UDim2.new(0.8, 0, 0, 34),
	TextSize = 26,
	Text = "",
})

-- Big center message.
local messageLabel = mkLabel(gui, {
	Name = "Message",
	Position = UDim2.new(0.5, 0, 0.22, 0),
	AnchorPoint = Vector2.new(0.5, 0.5),
	Size = UDim2.new(0.9, 0, 0, 60),
	TextSize = 42,
	Text = "",
})

-- Ammo pips (bottom center).
local ammoFrame = Instance.new("Frame")
ammoFrame.BackgroundTransparency = 1
ammoFrame.AnchorPoint = Vector2.new(0.5, 1)
ammoFrame.Position = UDim2.new(0.5, 0, 1, -22)
ammoFrame.Size = UDim2.new(0, 300, 0, 16)
ammoFrame.Parent = gui
local ammoLayout = Instance.new("UIListLayout")
ammoLayout.FillDirection = Enum.FillDirection.Horizontal
ammoLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
ammoLayout.Padding = UDim.new(0, 6)
ammoLayout.Parent = ammoFrame

local reloadLabel = mkLabel(gui, {
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -42),
	Size = UDim2.new(0, 300, 0, 20),
	TextSize = 16,
	TextColor3 = Color3.fromRGB(255, 200, 90),
	Text = "",
})

local function drawAmmo(current: number, max: number, reloading: boolean)
	for _, c in ammoFrame:GetChildren() do
		if c:IsA("Frame") then
			c:Destroy()
		end
	end
	for i = 1, math.min(max, 20) do
		local pip = Instance.new("Frame")
		pip.Size = UDim2.new(0, 10, 0, 14)
		pip.BorderSizePixel = 0
		pip.BackgroundColor3 = (i <= current) and Color3.fromRGB(255, 196, 64) or Color3.fromRGB(70, 70, 70)
		pip.Parent = ammoFrame
	end
	reloadLabel.Text = reloading and "RELOADING..." or ""
end

-- Block cooldown bar (above ammo).
local blockBack = Instance.new("Frame")
blockBack.AnchorPoint = Vector2.new(0.5, 1)
blockBack.Position = UDim2.new(0.5, 0, 1, -66)
blockBack.Size = UDim2.new(0, 160, 0, 6)
blockBack.BorderSizePixel = 0
blockBack.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
blockBack.Parent = gui
local blockBar = Instance.new("Frame")
blockBar.Size = UDim2.fromScale(1, 1)
blockBar.BorderSizePixel = 0
blockBar.BackgroundColor3 = Color3.fromRGB(120, 200, 255)
blockBar.Parent = blockBack

local blockReadyAt = 0
local blockTotal = 4.45
RunService.RenderStepped:Connect(function()
	local remaining = blockReadyAt - os.clock()
	if remaining <= 0 then
		blockBar.Size = UDim2.fromScale(1, 1)
	else
		blockBar.Size = UDim2.fromScale(1 - math.clamp(remaining / blockTotal, 0, 1), 1)
	end
end)

-- My health bar (bottom left).
local hpBack = Instance.new("Frame")
hpBack.Position = UDim2.new(0, 24, 1, -40)
hpBack.AnchorPoint = Vector2.new(0, 1)
hpBack.Size = UDim2.new(0, 220, 0, 18)
hpBack.BorderSizePixel = 0
hpBack.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
hpBack.Parent = gui
local hpBar = Instance.new("Frame")
hpBar.Size = UDim2.fromScale(1, 1)
hpBar.BorderSizePixel = 0
hpBar.BackgroundColor3 = Color3.fromRGB(90, 220, 90)
hpBar.Parent = hpBack
local hpText = mkLabel(hpBack, {
	Size = UDim2.fromScale(1, 1),
	TextSize = 13,
	Text = "",
})

local function watchHealth(char: Model)
	local humanoid = char:WaitForChild("Humanoid") :: Humanoid
	local function update()
		local frac = math.clamp(humanoid.Health / math.max(humanoid.MaxHealth, 1), 0, 1)
		hpBar.Size = UDim2.fromScale(frac, 1)
		hpText.Text = math.ceil(humanoid.Health) .. " / " .. math.floor(humanoid.MaxHealth)
	end
	humanoid.HealthChanged:Connect(update)
	update()
end
if player.Character then
	watchHealth(player.Character)
end
player.CharacterAdded:Connect(watchHealth)

-- Controls hint.
mkLabel(gui, {
	Position = UDim2.new(1, -12, 1, -12),
	AnchorPoint = Vector2.new(1, 1),
	Size = UDim2.new(0, 380, 0, 16),
	TextSize = 13,
	TextXAlignment = Enum.TextXAlignment.Right,
	TextTransparency = 0.35,
	Text = "A/D move · Space jump · Click shoot · F / Right-click block",
})

-- Message helper with auto-clear.
local messageToken = 0
local function showMessage(text: string, duration: number?)
	messageToken += 1
	local token = messageToken
	messageLabel.Text = text
	messageLabel.TextTransparency = 0
	task.delay(duration or 2, function()
		if messageToken == token then
			TweenService:Create(messageLabel, TweenInfo.new(0.4), { TextTransparency = 1 }):Play()
		end
	end)
end

-- ============================================================ Upgrade card picker

local overlay: Frame? = nil

local function clearOverlay()
	if overlay then
		overlay:Destroy()
		overlay = nil
	end
end

local function showUpgradeCards(cards: { { id: string, name: string, desc: string } }, pickTime: number)
	clearOverlay()
	local frame = Instance.new("Frame")
	frame.Size = UDim2.fromScale(1, 1)
	frame.BackgroundColor3 = Color3.new(0, 0, 0)
	frame.BackgroundTransparency = 0.45
	frame.Parent = gui
	overlay = frame

	mkLabel(frame, {
		Position = UDim2.new(0.5, 0, 0.16, 0),
		AnchorPoint = Vector2.new(0.5, 0.5),
		Size = UDim2.new(0.9, 0, 0, 50),
		TextSize = 36,
		Text = "You lost the round — pick an upgrade!",
	})

	local row = Instance.new("Frame")
	row.BackgroundTransparency = 1
	row.AnchorPoint = Vector2.new(0.5, 0.5)
	row.Position = UDim2.fromScale(0.5, 0.52)
	row.Size = UDim2.new(0.9, 0, 0.45, 0)
	row.Parent = frame
	local layout = Instance.new("UIListLayout")
	layout.FillDirection = Enum.FillDirection.Horizontal
	layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
	layout.VerticalAlignment = Enum.VerticalAlignment.Center
	layout.Padding = UDim.new(0, 24)
	layout.Parent = row

	for _, card in cards do
		local btn = Instance.new("TextButton")
		btn.Size = UDim2.new(0, 220, 0, 300)
		btn.BackgroundColor3 = Color3.fromRGB(35, 38, 52)
		btn.BorderSizePixel = 0
		btn.Text = ""
		btn.AutoButtonColor = true
		btn.Parent = row
		local corner = Instance.new("UICorner")
		corner.CornerRadius = UDim.new(0, 14)
		corner.Parent = btn
		local stroke = Instance.new("UIStroke")
		stroke.Color = Color3.fromRGB(255, 196, 64)
		stroke.Thickness = 2
		stroke.Parent = btn

		mkLabel(btn, {
			Position = UDim2.new(0.5, 0, 0, 20),
			AnchorPoint = Vector2.new(0.5, 0),
			Size = UDim2.new(0.9, 0, 0, 60),
			TextSize = 24,
			TextWrapped = true,
			Text = card.name,
			TextColor3 = Color3.fromRGB(255, 196, 64),
		})
		mkLabel(btn, {
			Position = UDim2.new(0.5, 0, 0, 100),
			AnchorPoint = Vector2.new(0.5, 0),
			Size = UDim2.new(0.85, 0, 0, 170),
			TextSize = 17,
			TextWrapped = true,
			Font = Enum.Font.Gotham,
			TextYAlignment = Enum.TextYAlignment.Top,
			Text = card.desc,
		})

		btn.MouseButton1Click:Connect(function()
			playerAction:FireServer("pick", card.id)
			clearOverlay()
		end)
	end

	local timer = mkLabel(frame, {
		Position = UDim2.new(0.5, 0, 0.85, 0),
		AnchorPoint = Vector2.new(0.5, 0.5),
		Size = UDim2.new(0.5, 0, 0, 30),
		TextSize = 20,
		Text = "",
	})
	task.spawn(function()
		local deadline = os.clock() + pickTime
		while overlay == frame do
			local left = math.max(0, deadline - os.clock())
			timer.Text = string.format("Auto-pick in %ds", math.ceil(left))
			if left <= 0 then
				break
			end
			task.wait(0.25)
		end
	end)
end

-- ============================================================ Server events

gameEvent.OnClientEvent:Connect(function(kind, ...)
	if kind == "message" then
		local text, duration = ...
		showMessage(text, duration)
	elseif kind == "scores" then
		local list, target = ...
		if #list >= 2 then
			local function side(entry): string
				local pips = ""
				for i = 1, target do
					pips ..= (i <= entry.wins) and "●" or "○"
				end
				return entry.name .. "  " .. pips
			end
			scoreLabel.Text = side(list[1]) .. "   ⚔   " .. side(list[2])
		else
			scoreLabel.Text = ""
		end
	elseif kind == "ammo" then
		drawAmmo(...)
	elseif kind == "stats" then
		local stats = ...
		myStats = stats
	elseif kind == "blockCD" then
		local cd = ...
		blockReadyAt = os.clock() + cd
		blockTotal = cd
	elseif kind == "offer" then
		showUpgradeCards(...)
	elseif kind == "offerClear" then
		clearOverlay()
	end
end)

-- ============================================================ Input: shoot, block, double jump

local firing = false

task.spawn(function()
	while true do
		if firing then
			playerAction:FireServer("fire", aimPoint)
			task.wait(math.max(1 / myStats.fireRate * 0.5, 0.06))
		else
			task.wait(0.03)
		end
	end
end)

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then
		return
	end
	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		firing = true
	elseif input.UserInputType == Enum.UserInputType.MouseButton2 or input.KeyCode == Enum.KeyCode.F then
		playerAction:FireServer("block")
	end
end)

UserInputService.InputEnded:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		firing = false
	end
end)

-- Extra jumps (Rocket Boots).
local jumpsUsed = 0
local lastAirJump = 0

local function hookJumps(char: Model)
	local humanoid = char:WaitForChild("Humanoid") :: Humanoid
	jumpsUsed = 0
	humanoid.StateChanged:Connect(function(_, new)
		if new == Enum.HumanoidStateType.Landed or new == Enum.HumanoidStateType.Running then
			jumpsUsed = 0
		elseif new == Enum.HumanoidStateType.Jumping then
			jumpsUsed = math.max(jumpsUsed, 1)
		end
	end)
end
if player.Character then
	hookJumps(player.Character)
end
player.CharacterAdded:Connect(hookJumps)

UserInputService.JumpRequest:Connect(function()
	local char = player.Character
	local humanoid = char and char:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health <= 0 then
		return
	end
	local state = humanoid:GetState()
	local airborne = state == Enum.HumanoidStateType.Freefall
	if airborne and jumpsUsed < myStats.jumps and os.clock() - lastAirJump > 0.25 then
		lastAirJump = os.clock()
		jumpsUsed += 1
		humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
	end
end)
