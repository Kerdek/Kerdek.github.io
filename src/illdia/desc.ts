import { Vec2, Vec3, Vec4, Mat2, Mat3, Mat4 } from "./matrix.js"

export type BufferTypeDesc =
  "short" |
  "ushort" |
  "int" |
  "uint" |
  "float"

export type BufferKindDesc =
  "array" |
  "element array"

export type BufferDesc = {
  type: BufferTypeDesc,
  kind: BufferKindDesc,
  data: number[] }

export type Diagram = {
  width: number
  height: number
  background: Vec3
  shaders?: { [i: string]: string }
  buffers?: { [i: string]: BufferDesc }
  tasks?: TaskDesc[]  }

export type TaskKindDesc =
  "points" |
  "triangles" |
  "triangle strip" |
  "lines" |
  "line strip"

export type TaskDesc = {
  kind: TaskKindDesc
  shader: string
  uniforms?: UniformDesc[]
  attributes?: AttributeDesc[]
  vertices: AttributeDesc
  transform?: Mat4
  indices?: string }

export type UniformIntDesc = {
  name: string
  type: "int"
  value: number }

export type UniformUintDesc = {
  name: string
  type: "uint"
  value: number }

export type UniformFloatDesc = {
  name: string
  type: "float"
  value: number }

export type UniformVec2Desc = {
  name: string
  type: "vec2"
  value: Vec2 }

export type UniformVec3Desc = {
  name: string
  type: "vec3"
  value: Vec3 }

export type UniformVec4Desc = {
  name: string
  type: "vec4"
  value: Vec4 }

export type UniformMat2Desc = {
  name: string
  type: "mat2",
  value: Mat2 }

export type UniformMat3Desc = {
  name: string
  type: "mat3",
  value: Mat3 }

export type UniformMat4Desc = {
  name: string
  type: "mat4",
  value: Mat4 }

export type UniformDesc =
  UniformIntDesc |
  UniformUintDesc |
  UniformFloatDesc |
  UniformVec2Desc |
  UniformVec3Desc |
  UniformVec4Desc |
  UniformMat2Desc |
  UniformMat3Desc |
  UniformMat4Desc

export type AttributeDesc = {
  name: string
  dimension: number
  buffer: string }
