--!strict
-- The card pool. Every upgrade has an id, a display name, a description, and an
-- apply() that mutates a fighter's stat sheet. Cards can stack across rounds.

local Config = require(script.Parent.Config)
type Stats = Config.Stats

export type Upgrade = {
	id: string,
	name: string,
	desc: string,
	apply: (stats: Stats) -> (),
}

local Upgrades: { Upgrade } = {
	-- ===== Bullet shape & feel =====
	{
		id = "big_bullets",
		name = "Big Bullets",
		desc = "Bullet size +100%, damage +25%, bullet speed -20%",
		apply = function(s)
			s.bulletSize *= 2
			s.damage *= 1.25
			s.bulletSpeed *= 0.8
		end,
	},
	{
		id = "fast_ball",
		name = "Fast Ball",
		desc = "Bullet speed +80%, bullet drop -50%",
		apply = function(s)
			s.bulletSpeed *= 1.8
			s.bulletGravity *= 0.5
		end,
	},
	{
		id = "bouncy",
		name = "Bouncy Castle",
		desc = "Bullets ricochet 2 extra times",
		apply = function(s)
			s.bounces += 2
		end,
	},
	{
		id = "laser_sight",
		name = "Laser Focus",
		desc = "No spread, bullet speed +40%",
		apply = function(s)
			s.spread = 0
			s.bulletSpeed *= 1.4
		end,
	},
	{
		id = "zero_g",
		name = "Zero-G Rounds",
		desc = "Bullets ignore gravity entirely",
		apply = function(s)
			s.bulletGravity = 0
		end,
	},
	{
		id = "mortar",
		name = "Mortar Shells",
		desc = "Damage +50%, small explosions, heavy bullet drop",
		apply = function(s)
			s.damage *= 1.5
			s.explosionRadius = math.max(s.explosionRadius, 5)
			s.bulletGravity += 90
		end,
	},

	-- ===== Firepower =====
	{
		id = "buckshot",
		name = "Buckshot",
		desc = "+2 bullets per shot, damage -40%, +8° spread",
		apply = function(s)
			s.bulletCount += 2
			s.damage *= 0.6
			s.spread += 8
		end,
	},
	{
		id = "twin_shot",
		name = "Twin Shot",
		desc = "+1 bullet per shot, +3° spread",
		apply = function(s)
			s.bulletCount += 1
			s.spread += 3
		end,
	},
	{
		id = "burst_fire",
		name = "Burst Fire",
		desc = "Fire 3-round bursts, damage -25%",
		apply = function(s)
			s.burst += 2
			s.damage *= 0.75
		end,
	},
	{
		id = "rapid_fire",
		name = "Rapid Fire",
		desc = "Attack speed +60%",
		apply = function(s)
			s.fireRate *= 1.6
		end,
	},
	{
		id = "glass_cannon",
		name = "Glass Cannon",
		desc = "Damage +75%, max health -35%",
		apply = function(s)
			s.damage *= 1.75
			s.maxHealth *= 0.65
		end,
	},
	{
		id = "sniper",
		name = "Sniper",
		desc = "Damage +100%, bullet speed +50%, attack speed -50%",
		apply = function(s)
			s.damage *= 2
			s.bulletSpeed *= 1.5
			s.fireRate *= 0.5
		end,
	},
	{
		id = "gatling",
		name = "Gatling",
		desc = "+6 ammo, attack speed +50%, damage -50%, +6° spread",
		apply = function(s)
			s.ammo += 6
			s.fireRate *= 1.5
			s.damage *= 0.5
			s.spread += 6
		end,
	},
	{
		id = "explosive",
		name = "Explosive Bullets",
		desc = "Bullets explode on impact (8 stud radius)",
		apply = function(s)
			s.explosionRadius = math.max(s.explosionRadius + 4, 8)
		end,
	},
	{
		id = "heavy_rounds",
		name = "Heavy Rounds",
		desc = "Knockback +150%",
		apply = function(s)
			s.knockback *= 2.5
		end,
	},
	{
		id = "dead_eye",
		name = "Dead Eye",
		desc = "Damage +40%, attack speed -20%",
		apply = function(s)
			s.damage *= 1.4
			s.fireRate *= 0.8
		end,
	},

	-- ===== Ammo economy =====
	{
		id = "huge_mag",
		name = "Huge Magazine",
		desc = "+3 ammo",
		apply = function(s)
			s.ammo += 3
		end,
	},
	{
		id = "quick_reload",
		name = "Quick Hands",
		desc = "Reload time -40%",
		apply = function(s)
			s.reloadTime *= 0.6
		end,
	},
	{
		id = "last_stand_mag",
		name = "Pocket Pistol",
		desc = "+1 ammo, attack speed +15%",
		apply = function(s)
			s.ammo += 1
			s.fireRate *= 1.15
		end,
	},

	-- ===== Survivability =====
	{
		id = "tank",
		name = "Tank",
		desc = "Max health +100%, move speed -20%",
		apply = function(s)
			s.maxHealth *= 2
			s.moveSpeed *= 0.8
		end,
	},
	{
		id = "juggernaut",
		name = "Juggernaut",
		desc = "Max health +50%",
		apply = function(s)
			s.maxHealth *= 1.5
		end,
	},
	{
		id = "kevlar",
		name = "Kevlar Vest",
		desc = "Take 20% less damage",
		apply = function(s)
			s.damageTakenMult *= 0.8
		end,
	},
	{
		id = "regen",
		name = "Regeneration",
		desc = "Recover 5 HP per second",
		apply = function(s)
			s.regen += 5
		end,
	},
	{
		id = "vampirism",
		name = "Vampirism",
		desc = "Heal for 50% of damage you deal",
		apply = function(s)
			s.lifesteal += 0.5
		end,
	},
	{
		id = "second_wind",
		name = "Second Wind",
		desc = "Once per round, survive a lethal hit with 1 HP",
		apply = function(s)
			s.flags.secondWind = true
		end,
	},
	{
		id = "thorns",
		name = "Thorns",
		desc = "Attackers take 25% of the damage they deal you",
		apply = function(s)
			s.flags.thorns = (s.flags.thorns or 0) + 0.25
		end,
	},

	-- ===== Mobility =====
	{
		id = "sprinter",
		name = "Sprinter",
		desc = "Move speed +30%",
		apply = function(s)
			s.moveSpeed *= 1.3
		end,
	},
	{
		id = "extra_jump",
		name = "Rocket Boots",
		desc = "+1 jump",
		apply = function(s)
			s.jumps += 1
		end,
	},
	{
		id = "featherweight",
		name = "Featherweight",
		desc = "Move speed +25%, jump +25%, max health -15%",
		apply = function(s)
			s.moveSpeed *= 1.25
			s.jumpPower *= 1.25
			s.maxHealth *= 0.85
		end,
	},
	{
		id = "adrenaline",
		name = "Adrenaline",
		desc = "Taking damage boosts your move speed for 2s",
		apply = function(s)
			s.flags.adrenaline = true
		end,
	},
	{
		id = "moon_boots",
		name = "Moon Boots",
		desc = "Jump power +40%",
		apply = function(s)
			s.jumpPower *= 1.4
		end,
	},

	-- ===== Block (shield) =====
	{
		id = "cool_block",
		name = "Cool Block",
		desc = "Block cooldown -50%",
		apply = function(s)
			s.blockCooldown *= 0.5
		end,
	},
	{
		id = "healing_block",
		name = "Restorative Block",
		desc = "Blocking heals you 20 HP",
		apply = function(s)
			s.flags.healBlock = (s.flags.healBlock or 0) + 20
		end,
	},
	{
		id = "shockwave_block",
		name = "Shockwave Block",
		desc = "Blocking shoves nearby enemies away",
		apply = function(s)
			s.flags.shockBlock = true
		end,
	},

	-- ===== Exotic bullet effects =====
	{
		id = "homing",
		name = "Homing",
		desc = "Bullets curve toward your enemy, damage -20%",
		apply = function(s)
			s.flags.homing = (s.flags.homing or 0) + 2.5
			s.damage *= 0.8
		end,
	},
	{
		id = "poison",
		name = "Toxic Rounds",
		desc = "Hits deal 24 extra damage over 5s",
		apply = function(s)
			s.flags.poison = (s.flags.poison or 0) + 24
		end,
	},
	{
		id = "chilling",
		name = "Chilling Rounds",
		desc = "Hits slow the enemy by 40% for 2s",
		apply = function(s)
			s.flags.chill = true
		end,
	},
	{
		id = "phasing",
		name = "Phase Rounds",
		desc = "Bullets pass through terrain, damage -20%",
		apply = function(s)
			s.flags.phase = true
			s.damage *= 0.8
		end,
	},

	-- ===== Body mods =====
	{
		id = "shrink",
		name = "Pocket-Sized",
		desc = "You're 30% smaller (harder to hit), max health -10%",
		apply = function(s)
			s.flags.scale = (s.flags.scale or 1) * 0.7
			s.maxHealth *= 0.9
		end,
	},
	{
		id = "giant",
		name = "Absolute Unit",
		desc = "You're 30% bigger, max health +40%",
		apply = function(s)
			s.flags.scale = (s.flags.scale or 1) * 1.3
			s.maxHealth *= 1.4
		end,
	},
}

-- Lookup by id.
local byId: { [string]: Upgrade } = {}
for _, u in Upgrades do
	byId[u.id] = u
end

local module = {
	list = Upgrades,
	byId = byId,
}

-- Returns `count` distinct random upgrades (used for the loser's card offer).
function module.roll(count: number): { Upgrade }
	local pool = table.clone(Upgrades)
	local picks = {}
	for _ = 1, math.min(count, #pool) do
		local i = math.random(#pool)
		table.insert(picks, pool[i])
		table.remove(pool, i)
	end
	return picks
end

return module
