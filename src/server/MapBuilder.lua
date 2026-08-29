--!strict
-- Builds/destroys the current arena from a MapDef.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Shared.Config)
local Maps = require(ReplicatedStorage.Shared.Maps)

local MapBuilder = {}

local currentFolder: Folder? = nil

function MapBuilder.getFolder(): Folder?
	return currentFolder
end

function MapBuilder.clear()
	if currentFolder then
		currentFolder:Destroy()
		currentFolder = nil
	end
end

-- Builds map `index` (1-5) and returns its two spawn positions as Vector3s.
function MapBuilder.build(index: number): (Folder, { Vector3 })
	MapBuilder.clear()

	local def = Maps[index]
	local folder = Instance.new("Folder")
	folder.Name = "Map"

	for i, plat in def.platforms do
		local x, y, w, h = plat[1], plat[2], plat[3], plat[4]
		local part = Instance.new("Part")
		part.Name = "Platform" .. i
		part.Anchored = true
		part.Size = Vector3.new(w, h, Config.PLATFORM_DEPTH)
		part.Position = Vector3.new(x, y, 0)
		part.Color = (i == 1) and def.color or def.accent
		part.Material = Enum.Material.SmoothPlastic
		part.TopSurface = Enum.SurfaceType.Smooth
		part.BottomSurface = Enum.SurfaceType.Smooth
		part.Parent = folder
	end

	-- Invisible side walls so fighters can't run off the ends of the world.
	for _, side in { -1, 1 } do
		local wall = Instance.new("Part")
		wall.Name = "Wall"
		wall.Anchored = true
		wall.Transparency = 1
		wall.Size = Vector3.new(4, 200, Config.PLATFORM_DEPTH * 3)
		wall.Position = Vector3.new(side * 85, 60, 0)
		wall.Parent = folder
	end

	folder.Parent = workspace
	currentFolder = folder

	local spawns = {}
	for _, s in def.spawns do
		table.insert(spawns, Vector3.new(s[1], s[2] + 4, 0))
	end
	return folder, spawns
end

return MapBuilder
