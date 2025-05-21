import { Vec3 } from "./matrix.js"

export type Diagram2D = {
  width: number
  height: number
  background: [number, number, number]
  tasks?: TaskDesc[]  }

export type TaskKindDesc =
  "points" |
  "triangles" |
  "triangle strip" |
  "lines" |
  "line strip"

export type TaskDesc = {
  kind: TaskKindDesc
  color: Vec3
  vertices: number[] }
