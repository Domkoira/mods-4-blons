--!strict
-- Five 2D arenas. Every map is a list of axis-aligned platforms on the Z=0
-- plane, described as {x, y, width, height} (x/y are the platform's center),
-- plus one spawn point per fighter. Units are studs.

export type Platform = { number } -- {centerX, centerY, width, height}
export type MapDef = {
	name: string,
	color: Color3,
	accent: Color3,
	platforms: { Platform },
	spawns: { { number } }, -- two {x, y} spawn points
}

local Maps: { MapDef } = {
	{
		-- Flat ground with three floating islands.
		name = "Highlands",
		color = Color3.fromRGB(88, 122, 82),
		accent = Color3.fromRGB(126, 168, 116),
		platforms = {
			{ 0, -2, 120, 4 }, -- ground
			{ -30, 12, 20, 2 },
			{ 30, 12, 20, 2 },
			{ 0, 24, 24, 2 },
		},
		spawns = { { -45, 4 }, { 45, 4 } },
	},
	{
		-- Two towers with a gap in the middle - fall and you die.
		name = "The Pit",
		color = Color3.fromRGB(120, 100, 84),
		accent = Color3.fromRGB(158, 134, 110),
		platforms = {
			{ -38, 0, 50, 8 }, -- left tower
			{ 38, 0, 50, 8 }, -- right tower
			{ 0, 18, 16, 2 }, -- center bridge, high up
			{ -20, 10, 10, 2 },
			{ 20, 10, 10, 2 },
		},
		spawns = { { -45, 8 }, { 45, 8 } },
	},
	{
		-- Staircases rising toward the middle.
		name = "Ziggurat",
		color = Color3.fromRGB(140, 118, 152),
		accent = Color3.fromRGB(176, 152, 190),
		platforms = {
			{ 0, -2, 130, 4 }, -- ground
			{ -40, 5, 22, 2 },
			{ 40, 5, 22, 2 },
			{ -22, 12, 18, 2 },
			{ 22, 12, 18, 2 },
			{ 0, 20, 20, 3 }, -- crown
		},
		spawns = { { -55, 4 }, { 55, 4 } },
	},
	{
		-- Small floating islands only - platforming duel.
		name = "Skyline",
		color = Color3.fromRGB(84, 110, 140),
		accent = Color3.fromRGB(120, 150, 184),
		platforms = {
			{ -45, 0, 22, 3 },
			{ 45, 0, 22, 3 },
			{ -18, 8, 14, 2 },
			{ 18, 8, 14, 2 },
			{ 0, 16, 12, 2 },
			{ -34, 18, 10, 2 },
			{ 34, 18, 10, 2 },
			{ 0, -6, 16, 2 }, -- low center saver
		},
		spawns = { { -45, 6 }, { 45, 6 } },
	},
	{
		-- A long canyon with walls you can hide behind.
		name = "Canyon",
		color = Color3.fromRGB(150, 104, 78),
		accent = Color3.fromRGB(184, 138, 104),
		platforms = {
			{ 0, -2, 140, 4 }, -- ground
			{ -15, 5, 4, 10 }, -- left cover wall
			{ 15, 5, 4, 10 }, -- right cover wall
			{ -45, 10, 16, 2 },
			{ 45, 10, 16, 2 },
			{ 0, 18, 26, 2 }, -- roof over the walls
		},
		spawns = { { -60, 4 }, { 60, 4 } },
	},
}

return Maps
