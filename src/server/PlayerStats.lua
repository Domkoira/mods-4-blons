--!strict
-- Tracks each fighter's stat sheet (their "build") across a match and applies
-- it to their character whenever they spawn.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)
local Upgrades = require(ReplicatedStorage.Shared.Upgrades)

type Stats = Config.Stats

local PlayerStats = {}

local stats: { [Player]: Stats } = {}
local upgradeNames: { [Player]: { string } } = {}

function PlayerStats.reset(player: Player)
	stats[player] = Config.freshStats()
	upgradeNames[player] = {}
end

function PlayerStats.get(player: Player): Stats
	if not stats[player] then
		PlayerStats.reset(player)
	end
	return stats[player]
end

function PlayerStats.getUpgradeNames(player: Player): { string }
	return upgradeNames[player] or {}
end

function PlayerStats.remove(player: Player)
	stats[player] = nil
	upgradeNames[player] = nil
end

function PlayerStats.applyUpgrade(player: Player, upgradeId: string): boolean
	local upgrade = Upgrades.byId[upgradeId]
	if not upgrade then
		return false
	end
	upgrade.apply(PlayerStats.get(player))
	table.insert(upgradeNames[player], upgrade.name)
	return true
end

-- Pushes the stat sheet onto a freshly spawned character.
function PlayerStats.applyToCharacter(player: Player, character: Model)
	local s = PlayerStats.get(player)
	local humanoid = character:WaitForChild("Humanoid", 5) :: Humanoid?
	if not humanoid then
		return
	end

	humanoid.MaxHealth = s.maxHealth
	humanoid.Health = s.maxHealth
	humanoid.WalkSpeed = s.moveSpeed
	humanoid.UseJumpPower = true
	humanoid.JumpPower = s.jumpPower
	humanoid.BreakJointsOnDeath = false

	-- Body scale from shrink/giant cards (R15 rigs expose scale values).
	local scale = s.flags.scale
	if scale and scale ~= 1 then
		for _, valueName in { "BodyHeightScale", "BodyWidthScale", "BodyDepthScale", "HeadScale" } do
			local v = humanoid:FindFirstChild(valueName)
			if v and v:IsA("NumberValue") then
				v.Value *= scale
			end
		end
	end
end

return PlayerStats
