--!strict
-- Global game configuration + the base stat sheet every fighter starts a match with.

local Config = {
	-- Match rules
	WINS_TO_TAKE_MATCH = 3, -- first to 3 round wins takes the match
	ROUND_INTERMISSION = 2.5, -- seconds between rounds
	COUNTDOWN_TIME = 3, -- "3..2..1..FIGHT" freeze time
	MATCH_OVER_TIME = 6, -- celebration time before a fresh match starts

	-- Upgrades
	UPGRADE_CHOICES = 3, -- loser picks 1 of this many cards
	UPGRADE_PICK_TIME = 20, -- auto-picks the first card after this many seconds

	-- World
	KILL_Y = -40, -- falling below this counts as dying
	PLATFORM_DEPTH = 10, -- how thick (on the Z axis) map platforms are

	-- Blocking (the ROUNDS shield)
	BLOCK_DURATION = 0.45, -- seconds of invulnerability per block
	BLOCK_CLEAR_RADIUS = 9, -- bullets within this radius get deleted when you block

	-- Everything a fighter's build is made of. Upgrades mutate a copy of this.
	BASE_STATS = {
		maxHealth = 100,
		regen = 0, -- HP per second

		damage = 26,
		fireRate = 1.6, -- shots per second
		ammo = 3, -- shots before a reload
		reloadTime = 1.6, -- seconds

		bulletSpeed = 110,
		bulletGravity = 55, -- studs/s^2 pulling bullets down
		bulletSize = 0.7,
		bulletCount = 1, -- bullets per shot (shotgun style)
		burst = 1, -- consecutive shots per trigger pull
		spread = 0, -- degrees of random spread
		bounces = 0, -- times a bullet ricochets off terrain
		explosionRadius = 0,
		knockback = 35,
		lifesteal = 0, -- fraction of damage dealt returned as HP

		moveSpeed = 18,
		jumpPower = 55,
		jumps = 1, -- total jumps (2 = double jump)

		blockCooldown = 4,
		damageTakenMult = 1, -- armor (< 1 means you take less)

		-- Special behaviors granted by upgrades. Values are truthy flags or magnitudes.
		flags = {} :: { [string]: any },
	},
}

export type Stats = typeof(Config.BASE_STATS)

-- Deep-copies the base stat sheet so each fighter mutates their own copy.
function Config.freshStats(): Stats
	local copy = table.clone(Config.BASE_STATS)
	copy.flags = {}
	return copy
end

return Config
