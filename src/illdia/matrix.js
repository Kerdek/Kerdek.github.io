export class Vec2 {
    0;
    1;
    constructor(x, y) {
        this[0] = x;
        this[1] = y;
    }
    static zero() {
        return new Vec2(0, 0);
    }
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index == 0 || index == 1) {
                    const value = this[index];
                    index++;
                    return { value, done: false };
                }
                else {
                    return { value: undefined, done: true };
                }
            }
        };
    }
    mag() {
        return Math.sqrt(Math.pow(this[0], 2.0) +
            Math.pow(this[1], 2.0));
    }
    normalize() {
        return this.mul(1.0 / this.mag());
    }
    add(y) {
        return new Vec2(this[0] + y[0], this[1] + y[1]);
    }
    sub(y) {
        return new Vec2(this[0] - y[0], this[1] - y[1]);
    }
    mul(y) {
        return typeof y === "number" ?
            new Vec2(this[0] * y, this[1] * y) :
            new Vec2(this[0] * y[0] + this[1] * y[1], this[0] * y[2] + this[1] * y[3]);
    }
}
export class Vec3 {
    0;
    1;
    2;
    constructor(x, y, z) {
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }
    static zero() {
        return new Vec3(0, 0, 0);
    }
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index == 0 || index == 1 || index == 2) {
                    const value = this[index];
                    index++;
                    return { value, done: false };
                }
                else {
                    return { value: undefined, done: true };
                }
            }
        };
    }
    mag() {
        return Math.sqrt(Math.pow(this[0], 2.0) +
            Math.pow(this[1], 2.0) +
            Math.pow(this[2], 2.0));
    }
    normalize() {
        return this.mul(1.0 / this.mag());
    }
    add(y) {
        return new Vec3(this[0] + y[0], this[1] + y[1], this[2] + y[2]);
    }
    sub(y) {
        return new Vec3(this[0] - y[0], this[1] - y[1], this[2] - y[2]);
    }
    mul(y) {
        return typeof y === "number" ?
            new Vec3(this[0] * y, this[1] * y, this[2] * y) :
            new Vec3(this[0] * y[0] + this[1] * y[1] + this[2] * y[2], this[0] * y[3] + this[1] * y[4] + this[2] * y[5], this[0] * y[6] + this[1] * y[7] + this[2] * y[8]);
    }
}
export class Vec4 {
    0;
    1;
    2;
    3;
    constructor(x, y, z, w) {
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
    }
    static zero() {
        return new Vec4(0, 0, 0, 0);
    }
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index == 0 || index == 1 || index == 2 || index == 3) {
                    const value = this[index];
                    index++;
                    return { value, done: false };
                }
                else {
                    return { value: undefined, done: true };
                }
            }
        };
    }
    mag() {
        return Math.sqrt(Math.pow(this[0], 2.0) +
            Math.pow(this[1], 2.0) +
            Math.pow(this[2], 2.0) +
            Math.pow(this[3], 2.0));
    }
    normalize() {
        return this.mul(1.0 / this.mag());
    }
    add(y) {
        return new Vec4(this[0] + y[0], this[1] + y[1], this[2] + y[2], this[3] + y[3]);
    }
    sub(y) {
        return new Vec4(this[0] - y[0], this[1] - y[1], this[2] - y[2], this[3] - y[3]);
    }
    mul(y) {
        return typeof y === "number" ?
            new Vec4(this[0] * y, this[1] * y, this[2] * y, this[3] * y) :
            new Vec4(this[0] * y[0] + this[1] * y[1] + this[2] * y[2] + this[3] * y[3], this[0] * y[4] + this[1] * y[5] + this[2] * y[6] + this[3] * y[7], this[0] * y[8] + this[1] * y[9] + this[2] * y[10] + this[3] * y[11], this[0] * y[12] + this[1] * y[13] + this[2] * y[14] + this[3] * y[15]);
    }
}
export class Mat2 {
    0;
    1;
    2;
    3;
    constructor(xx, xy, yx, yy) {
        this[0] = xx;
        this[1] = xy;
        this[2] = yx;
        this[3] = yy;
    }
    static identity() {
        return new Mat2(1.0, 0.0, 0.0, 1.0);
    }
    static scale(amount) {
        return new Mat2(amount, 0.0, 0.0, amount);
    }
    static rotate(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Mat2(c, -s, s, c);
    }
    mul(y) {
        return y instanceof Vec2 ?
            new Vec2(y[0] * this[0] + y[1] * this[2], y[0] * this[1] + y[1] * this[3]) :
            new Mat2(y[0] * this[0] + y[1] * this[2], y[0] * this[1] + y[1] * this[3], y[2] * this[0] + y[3] * this[2], y[2] * this[1] + y[3] * this[3]);
    }
    inverse() {
        const a00 = this[0], a01 = this[1], a10 = this[2], a11 = this[3];
        const det = a00 * a11 - a01 * a10;
        return new Mat2(a11 / det, -a10 / det, -a01 / det, a11 / det);
    }
}
export class Mat3 {
    0;
    1;
    2;
    3;
    4;
    5;
    6;
    7;
    8;
    constructor(xx, xy, xz, yx, yy, yz, zx, zy, zz) {
        this[0] = xx;
        this[1] = xy;
        this[2] = xz;
        this[3] = yx;
        this[4] = yy;
        this[5] = yz;
        this[6] = zx;
        this[7] = zy;
        this[8] = zz;
    }
    static identity() {
        return new Mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0);
    }
    static translate(amount) {
        return new Mat3(1.0, 0.0, amount[0], 0.0, 1.0, amount[1], 0.0, 0.0, 1.0);
    }
    static scale2(amount) {
        return new Mat3(amount, 0.0, 0.0, 0.0, amount, 0.0, 0.0, 0.0, 1.0);
    }
    static scale3(amount) {
        return new Mat3(amount, 0.0, 0.0, 0.0, amount, 0.0, 0.0, 0.0, amount);
    }
    static axis_angle(axis, angle) {
        axis = axis.normalize();
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const l = axis.mul(1.0 - c);
        const m = new Vec3(l[0] * axis[1], l[1] * axis[2], l[2] * axis[0]);
        const n = axis.mul(s);
        return new Mat3(l[0] * axis[0] + c, m[0] - n[2], m[2] + n[1], m[0] + n[2], l[1] * axis[1] + c, m[1] - n[0], m[2] - n[1], m[1] + n[0], l[2] * axis[2] + c);
    }
    mul(y) {
        return y instanceof Vec3 ?
            new Vec3(y[0] * this[0] + y[1] * this[3] + y[2] * this[6], y[0] * this[1] + y[1] * this[4] + y[2] * this[7], y[0] * this[2] + y[1] * this[5] + y[2] * this[8]) :
            new Mat3(y[0] * this[0] + y[1] * this[3] + y[2] * this[6], y[0] * this[1] + y[1] * this[4] + y[2] * this[7], y[0] * this[2] + y[1] * this[5] + y[2] * this[8], y[3] * this[0] + y[4] * this[3] + y[5] * this[6], y[3] * this[1] + y[4] * this[4] + y[5] * this[7], y[3] * this[2] + y[4] * this[5] + y[5] * this[8], y[6] * this[0] + y[7] * this[3] + y[8] * this[6], y[6] * this[1] + y[7] * this[4] + y[8] * this[7], y[6] * this[2] + y[7] * this[5] + y[8] * this[8]);
    }
    inverse() {
        const a00 = this[0], a01 = this[1], a02 = this[2], a10 = this[3], a11 = this[4], a12 = this[5], a20 = this[6], a21 = this[7], a22 = this[8];
        const b0 = a11 * a22 - a12 * a21, b1 = a12 * a20 - a10 * a22, b2 = a10 * a21 - a11 * a20;
        const det = a00 * b0 +
            a01 * b1 +
            a02 * b2;
        return new Mat3(b0 / det, (a02 * a21 - a01 * a22) / det, (a01 * a12 - a02 * a11) / det, b1 / det, (a00 * a22 - a02 * a20) / det, (a02 * a10 - a00 * a12) / det, b2 / det, (a01 * a20 - a00 * a21) / det, (a00 * a11 - a01 * a10) / det);
    }
}
export class Mat4 {
    0;
    1;
    2;
    3;
    4;
    5;
    6;
    7;
    8;
    9;
    10;
    11;
    12;
    13;
    14;
    15;
    constructor(xx, xy, xz, xw, yx, yy, yz, yw, zx, zy, zz, zw, wx, wy, wz, ww) {
        this[0] = xx;
        this[1] = xy;
        this[2] = xz;
        this[3] = xw;
        this[4] = yx;
        this[5] = yy;
        this[6] = yz;
        this[7] = yw;
        this[8] = zx;
        this[9] = zy;
        this[10] = zz;
        this[11] = zw;
        this[12] = wx;
        this[13] = wy;
        this[14] = wz;
        this[15] = ww;
    }
    static identity() {
        return new Mat4(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
    }
    static translate(amount) {
        return new Mat4(1.0, 0.0, 0.0, amount[0], 0.0, 1.0, 0.0, amount[1], 0.0, 0.0, 1.0, amount[2], 0.0, 0.0, 0.0, 1.0);
    }
    static scale3(amount) {
        return new Mat4(amount, 0.0, 0.0, 0.0, 0.0, amount, 0.0, 0.0, 0.0, 0.0, amount, 0.0, 0.0, 0.0, 0.0, 1.0);
    }
    static scale4(amount) {
        return new Mat4(amount, 0.0, 0.0, 0.0, 0.0, amount, 0.0, 0.0, 0.0, 0.0, amount, 0.0, 0.0, 0.0, 0.0, amount);
    }
    static mul_vec(m, v) {
        return new Vec4(v[0] * m[0] + v[1] * m[4] + v[2] * m[8] + v[3] * m[12], v[0] * m[1] + v[1] * m[5] + v[2] * m[9] + v[3] * m[13], v[0] * m[2] + v[1] * m[6] + v[2] * m[10] + v[3] * m[14], v[0] * m[3] + v[1] * m[7] + v[2] * m[11] + v[3] * m[15]);
    }
    static axis_angle(axis, angle) {
        axis = axis.normalize();
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const l = axis.mul(1.0 - c);
        const m = new Vec3(l[0] * axis[1], l[1] * axis[2], l[2] * axis[0]);
        const n = axis.mul(s);
        return new Mat4(l[0] * axis[0] + c, m[0] - n[2], m[2] + n[1], 0.0, m[0] + n[2], l[1] * axis[1] + c, m[1] - n[0], 0.0, m[2] - n[1], m[1] + n[0], l[2] * axis[2] + c, 0.0, 0.0, 0.0, 0.0, 1.0);
    }
    static pointwise(width, height) {
        return new Mat4(2.0 / width, 0.0, 0.0, -1.0 + 1.0 / width, 0.0, -2.0 / height, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
    }
    static perspective(zoom, width, height) {
        const diag = zoom * Math.sqrt(Math.pow(width, 2.0) + Math.pow(height, 2.0));
        return new Mat4(diag / width, 0.0, 0.0, 0.0, 0.0, diag / height, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0);
    }
    mul(y) {
        return y instanceof Vec4 ?
            new Vec4(y[0] * this[0] + y[1] * this[4] + y[2] * this[8] + y[3] * this[12], y[0] * this[1] + y[1] * this[5] + y[2] * this[9] + y[3] * this[13], y[0] * this[2] + y[1] * this[6] + y[2] * this[10] + y[3] * this[14], y[0] * this[3] + y[1] * this[7] + y[2] * this[11] + y[3] * this[15]) :
            new Mat4(y[0] * this[0] + y[1] * this[4] + y[2] * this[8] + y[3] * this[12], y[0] * this[1] + y[1] * this[5] + y[2] * this[9] + y[3] * this[13], y[0] * this[2] + y[1] * this[6] + y[2] * this[10] + y[3] * this[14], y[0] * this[3] + y[1] * this[7] + y[2] * this[11] + y[3] * this[15], y[4] * this[0] + y[5] * this[4] + y[6] * this[8] + y[7] * this[12], y[4] * this[1] + y[5] * this[5] + y[6] * this[9] + y[7] * this[13], y[4] * this[2] + y[5] * this[6] + y[6] * this[10] + y[7] * this[14], y[4] * this[3] + y[5] * this[7] + y[6] * this[11] + y[7] * this[15], y[8] * this[0] + y[9] * this[4] + y[10] * this[8] + y[11] * this[12], y[8] * this[1] + y[9] * this[5] + y[10] * this[9] + y[11] * this[13], y[8] * this[2] + y[9] * this[6] + y[10] * this[10] + y[11] * this[14], y[8] * this[3] + y[9] * this[7] + y[10] * this[11] + y[11] * this[15], y[12] * this[0] + y[13] * this[4] + y[14] * this[8] + y[15] * this[12], y[12] * this[1] + y[13] * this[5] + y[14] * this[9] + y[15] * this[13], y[12] * this[2] + y[13] * this[6] + y[14] * this[10] + y[15] * this[14], y[12] * this[3] + y[13] * this[7] + y[14] * this[11] + y[15] * this[15]);
    }
    inverse() {
        const a00 = this[0], a01 = this[1], a02 = this[2], a03 = this[3], a10 = this[4], a11 = this[5], a12 = this[6], a13 = this[7], a20 = this[8], a21 = this[9], a22 = this[10], a23 = this[11], a30 = this[12], a31 = this[13], a32 = this[14], a33 = this[15], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        return new Mat4((a11 * b11 - a12 * b10 + a13 * b09) / det, (a02 * b10 - a01 * b11 - a03 * b09) / det, (a31 * b05 - a32 * b04 + a33 * b03) / det, (a22 * b04 - a21 * b05 - a23 * b03) / det, (a12 * b08 - a10 * b11 - a13 * b07) / det, (a00 * b11 - a02 * b08 + a03 * b07) / det, (a32 * b02 - a30 * b05 - a33 * b01) / det, (a20 * b05 - a22 * b02 + a23 * b01) / det, (a10 * b10 - a11 * b08 + a13 * b06) / det, (a01 * b08 - a00 * b10 - a03 * b06) / det, (a30 * b04 - a31 * b02 + a33 * b00) / det, (a21 * b02 - a20 * b04 - a23 * b00) / det, (a11 * b07 - a10 * b09 - a12 * b06) / det, (a00 * b09 - a01 * b07 + a02 * b06) / det, (a31 * b01 - a30 * b03 - a32 * b00) / det, (a20 * b03 - a21 * b01 + a22 * b00) / det);
    }
}
//# sourceMappingURL=matrix.js.map