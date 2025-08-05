import { Mat4 } from "./matrix"

export type Table<T> = { [i in string]: T }
export type SymbolTable<T> = { [i in symbol]: T }

export type MaterialType =
  "null" | "emit" | "diffuse" | "phong"

export type SurfaceType =
  "sphere" | "plane"

export type Material = {
  type: MaterialType
  text: string }

export type Surface = {
  type: SurfaceType
  text: string }

export type GeometryGroupInstance = {
  transform: Mat4,
  geometry: string }

export type GeometryNull = {
  type: 'null' }

export type GeometryGroup = {
  type: 'group',
  instances: Table<GeometryGroupInstance> }

export type GeometrySurface = {
  type: 'surface',
  material: string
  surface: string }

export type Geometry =
  GeometryNull |
  GeometryGroup |
  GeometrySurface

export type Scene = {
  scripts: Table<string>,
  materials: Table<Material>,
  surfaces: Table<Surface>,
  geometry: Table<Geometry> }
