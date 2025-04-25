export const mag = (v) => Math.sqrt(Math.pow(v[0], 2.0) +
    Math.pow(v[1], 2.0) +
    Math.pow(v[2], 2.0));
export const mag4 = (v) => Math.sqrt(Math.pow(v[0], 2.0) +
    Math.pow(v[1], 2.0) +
    Math.pow(v[2], 2.0) +
    Math.pow(v[3], 2.0));
export const smul = (x, v) => [
    v[0] * x,
    v[1] * x,
    v[2] * x
];
export const smul4 = (x, v) => [
    v[0] * x,
    v[1] * x,
    v[2] * x,
    v[3] * x
];
export const normalize = (v) => smul(1.0 / mag(v), v);
export const normalize4 = (v) => smul4(1.0 / mag4(v), v);
export const vmul = (v, m) => [
    v[0] * m[0] + v[1] * m[1] + v[2] * m[2] + v[3] * m[3],
    v[0] * m[4] + v[1] * m[5] + v[2] * m[6] + v[3] * m[7],
    v[0] * m[8] + v[1] * m[9] + v[2] * m[10] + v[3] * m[11],
    v[0] * m[12] + v[1] * m[13] + v[2] * m[14] + v[3] * m[15]
];
export const mmul = (x, y) => [
    y[0] * x[0] + y[1] * x[4] + y[2] * x[8] + y[3] * x[12],
    y[0] * x[1] + y[1] * x[5] + y[2] * x[9] + y[3] * x[13],
    y[0] * x[2] + y[1] * x[6] + y[2] * x[10] + y[3] * x[14],
    y[0] * x[3] + y[1] * x[7] + y[2] * x[11] + y[3] * x[15],
    y[4] * x[0] + y[5] * x[4] + y[6] * x[8] + y[7] * x[12],
    y[4] * x[1] + y[5] * x[5] + y[6] * x[9] + y[7] * x[13],
    y[4] * x[2] + y[5] * x[6] + y[6] * x[10] + y[7] * x[14],
    y[4] * x[3] + y[5] * x[7] + y[6] * x[11] + y[7] * x[15],
    y[8] * x[0] + y[9] * x[4] + y[10] * x[8] + y[11] * x[12],
    y[8] * x[1] + y[9] * x[5] + y[10] * x[9] + y[11] * x[13],
    y[8] * x[2] + y[9] * x[6] + y[10] * x[10] + y[11] * x[14],
    y[8] * x[3] + y[9] * x[7] + y[10] * x[11] + y[11] * x[15],
    y[12] * x[0] + y[13] * x[4] + y[14] * x[8] + y[15] * x[12],
    y[12] * x[1] + y[13] * x[5] + y[14] * x[9] + y[15] * x[13],
    y[12] * x[2] + y[13] * x[6] + y[14] * x[10] + y[15] * x[14],
    y[12] * x[3] + y[13] * x[7] + y[14] * x[11] + y[15] * x[15]
];
export const identity = () => {
    return [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];
};
export const translate = (amount) => {
    return [
        1.0, 0.0, 0.0, amount[0],
        0.0, 1.0, 0.0, amount[1],
        0.0, 0.0, 1.0, amount[2],
        0.0, 0.0, 0.0, 1.0
    ];
};
export const scale = (amount) => {
    return [
        amount, 0.0, 0.0, 0.0,
        0.0, amount, 0.0, 0.0,
        0.0, 0.0, amount, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];
};
export const skew = (amount) => {
    return [
        amount[0], 0.0, 0.0, 0.0,
        0.0, amount[1], 0.0, 0.0,
        0.0, 0.0, amount[2], 0.0,
        0.0, 0.0, 0.0, 1.0
    ];
};
export const axis_angle = (axis, angle) => {
    axis = normalize(axis);
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const l = smul(1.0 - c, axis);
    const m = [
        l[0] * axis[1],
        l[1] * axis[2],
        l[2] * axis[0]
    ];
    const n = smul(s, axis);
    return [
        l[0] * axis[0] + c, m[0] - n[2], m[2] + n[1], 0.0,
        m[0] + n[2], l[1] * axis[1] + c, m[1] - n[0], 0.0,
        m[2] - n[1], m[1] + n[0], l[2] * axis[2] + c, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];
};
export const inverse = (m) => {
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3], a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7], a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11], a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    return [
        (a11 * b11 - a12 * b10 + a13 * b09) / det,
        (a02 * b10 - a01 * b11 - a03 * b09) / det,
        (a31 * b05 - a32 * b04 + a33 * b03) / det,
        (a22 * b04 - a21 * b05 - a23 * b03) / det,
        (a12 * b08 - a10 * b11 - a13 * b07) / det,
        (a00 * b11 - a02 * b08 + a03 * b07) / det,
        (a32 * b02 - a30 * b05 - a33 * b01) / det,
        (a20 * b05 - a22 * b02 + a23 * b01) / det,
        (a10 * b10 - a11 * b08 + a13 * b06) / det,
        (a01 * b08 - a00 * b10 - a03 * b06) / det,
        (a30 * b04 - a31 * b02 + a33 * b00) / det,
        (a21 * b02 - a20 * b04 - a23 * b00) / det,
        (a11 * b07 - a10 * b09 - a12 * b06) / det,
        (a00 * b09 - a01 * b07 + a02 * b06) / det,
        (a31 * b01 - a30 * b03 - a32 * b00) / det,
        (a20 * b03 - a21 * b01 + a22 * b00) / det
    ];
};
export const perspective = (zoom, width, height) => {
    const diag = zoom * Math.sqrt(Math.pow(width, 2.0) + Math.pow(height, 2.0));
    return [
        diag / width, 0.0, 0.0, 0.0,
        0.0, diag / height, 0.0, 0.0,
        0.0, 0.0, 0.0, 1.0,
        0.0, 0.0, -1.0, 0.0
    ];
};
//# sourceMappingURL=matrix.js.map