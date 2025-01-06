#ifndef UJS_HH
#define UJS_HH

#include <stddef.h>
#include <stdlib.h>

#include <memory.h>

template<typename A, typename B>
struct is_same {
  static constexpr bool value = false; };

template<typename A>
struct is_same<A, A> {
  static constexpr bool value = true; };

template<typename A, typename B>
constexpr bool is_same_v = is_same<A, B>::value;

struct js { size_t a; };

inline js nulljs = { 0 };

extern "C" {

void js_log(const char *p, size_t n);
js js_drop(js a);
js js_copy(js a);

js js_value_closure(size_t f, size_t p);
js js_void_closure(size_t f, size_t p);

js js_new_object();
js js_new_array();
js js_numberusize(size_t x);
js js_numberull(unsigned long long x);
js js_numberf32(float x);
js js_numberf64(double x);
js js_string8(const char *p, size_t n);
js js_string16(const char16_t *p, size_t n);
js js_boolean(bool x);
js js_null();
js js_undefined();

double js_get_double(js a);
size_t js_get_ulong(js a);
size_t js_get_long(js a);
bool js_get_boolean(js a);
// const char *js_get_string(js a);

js js_window();
js js_eval(js a);

js js_typeof(js a);

js js_new(js a, size_t b, js *c);
js js_delete(js s);

js js_call(js a, size_t b, js *c);
js js_elem(js a, js b);

js js_pos(js a);
js js_neg(js a);
js js_not(js a);
js js_cmp(js a);
js js_add(js a, js b);
js js_sub(js a, js b);
js js_mul(js a, js b);
js js_div(js a, js b);
js js_mod(js a, js b);
js js_and(js a, js b);
js js_or(js a, js b);
js js_xor(js a, js b);
js js_shl(js a, js b);
js js_shr(js a, js b);
js js_gt(js a, js b);
js js_lt(js a, js b);
js js_ge(js a, js b);
js js_le(js a, js b);
js js_ee(js a, js b);
js js_nn(js a, js b);
js js_eee(js a, js b);
js js_nnn(js a, js b);

js js_asse(js a, js b);
js js_adde(js a, js b);
js js_sube(js a, js b);
js js_mule(js a, js b);
js js_dive(js a, js b);
js js_mode(js a, js b);
js js_ande(js a, js b);
js js_ore(js a, js b);
js js_xore(js a, js b);
js js_shle(js a, js b);
js js_shre(js a, js b);

}

template<typename T>
static T &&move(T &x) {
  return static_cast<T &&>(x); }

constexpr void *operator new (
  unsigned long, void *p) {
  return p; }

template<size_t N>
void ujs_log(const char (&x)[N]) {
  js_log(x, N - 1); }

inline void ujs_log(const char *p, size_t n) {
  js_log(p, n); }

inline static ptrdiff_t to_digits(char *p, size_t n) {
  if (n == 0) {
    p[0] = '0';
    p[1] = 0;
    return 1; }
  char *a = p;
  while(n) {
    *a = n % 10 + '0';
    n /= 10;
    a += 1; }
  *a = 0;
  const ptrdiff_t z = a - p;
  a -= 1;
  while (a > p) {
    char t = *a;
    *a = *p;
    *p = t;
    p += 1;
    a -= 1; }
  return z; }

struct ujs {
  ujs() = delete;
  ujs(js j) : v(j) { }
  ujs(const ujs &o) : v(js_copy(o.v)) { }
  ujs(size_t x) : v(js_numberusize(x)) { }
  ujs(unsigned long long x) : v(js_numberull(x)) { }
  ujs(float x) : v(js_numberf32(x)) { }
  ujs(double x) : v(js_numberf64(x)) { }
  ujs(bool x) : v(js_boolean(x)) { }

  ujs(ujs &&o): v(nulljs) {
    js t0 = o.v;
    o.v = v;
    v = t0; }
  ~ujs() {
    if (v.a == 0) return;
    js_drop(v); }

  ujs operator [](ujs const &b) const { return ujs(js_elem(v, b.v)); }
  template<typename ...T> ujs operator ()(T const &...b) const {
    js q[] = { b.v... };
    return ujs(js_call(v, sizeof...(b), q)); }
  ujs operator =(ujs const &b) const { return ujs(js_asse(v, b.v)); }

  js v; };

template<typename F>
static js ujs_invoke_value(size_t f, js x) {
  ujs r = (*reinterpret_cast<F *>(f))(ujs(x));
  js v = r.v;
  r.v = nulljs;
  return v; }

template<typename F>
static void ujs_invoke_void(size_t f, js x) {
  return (*reinterpret_cast<F *>(f))(ujs(x)); }

inline auto ujs_closure = []<typename F>(F f) {
  if constexpr (is_same_v<decltype(f(ujs(nulljs))), ujs>) {
    return ujs(js_value_closure(
      reinterpret_cast<size_t>(&ujs_invoke_value<F>),
      reinterpret_cast<size_t>(new (malloc(sizeof(F))) F(move(f))))); }
  else {
    static_assert(is_same_v<decltype(f(ujs(nulljs))), void>);
    return ujs(js_void_closure(
      reinterpret_cast<size_t>(&ujs_invoke_void<F>),
      reinterpret_cast<size_t>(new (malloc(sizeof(F))) F(move(f))))); } };

inline ujs ujs_new_object() { return ujs(js_new_object()); }
inline ujs ujs_new_array() { return ujs(js_new_array()); }
inline ujs ujs_string8(const char *p, size_t n) { return ujs(js_string8(p, n)); }
inline ujs ujs_string16(const char16_t *p, size_t n) { return ujs(js_string16(p, n)); }
inline ujs ujs_boolean(bool x) { return ujs(js_boolean(x)); }
inline ujs ujs_null() { return ujs(js_null()); }
inline ujs ujs_undefined() { return ujs(js_undefined()); }

inline double ujs_get_double(ujs const &a) { return js_get_double(a.v); }
inline unsigned long ujs_get_ulong(ujs const &a) { return js_get_ulong(a.v); }
inline long ujs_get_long(ujs const &a) { return js_get_long(a.v); }
inline bool ujs_get_boolean(ujs const &a) { return js_get_boolean(a.v); }
// const char *ujs_get_string(ujs a) { return js_get_string(a.v); }

inline ujs ujs_typeof(ujs const &a) { return ujs(js_typeof(a.v)); }

inline ujs ujs_eval(ujs const &a) { return ujs(js_eval(a.v)); }
inline ujs ujs_window() { return ujs(js_window()); }

template<typename ...T> ujs ujs_new(ujs const &a, T const &...b) {
  js q[] = { b.v... };
  return ujs(js_new(a.v, sizeof...(b), q)); }

inline ujs ujs_delete(ujs const &a) { return ujs(js_delete(a.v)); }

inline ujs operator +(ujs const &a) { return ujs(js_pos(a.v)); }
inline ujs operator -(ujs const &a) { return ujs(js_neg(a.v)); }
inline ujs operator !(ujs const &a) { return ujs(js_not(a.v)); }
inline ujs operator ~(ujs const &a) { return ujs(js_cmp(a.v)); }
inline ujs operator +(ujs const &a, ujs const &b) { return ujs(js_add(a.v, b.v)); }
inline ujs operator -(ujs const &a, ujs const &b) { return ujs(js_sub(a.v, b.v)); }
inline ujs operator *(ujs const &a, ujs const &b) { return ujs(js_mul(a.v, b.v)); }
inline ujs operator /(ujs const &a, ujs const &b) { return ujs(js_div(a.v, b.v)); }
inline ujs operator %(ujs const &a, ujs const &b) { return ujs(js_mod(a.v, b.v)); }
inline ujs operator &(ujs const &a, ujs const &b) { return ujs(js_and(a.v, b.v)); }
inline ujs operator |(ujs const &a, ujs const &b) { return ujs(js_or(a.v, b.v)); }
inline ujs operator ^(ujs const &a, ujs const &b) { return ujs(js_xor(a.v, b.v)); }
inline ujs operator <<(ujs const &a, ujs const &b) { return ujs(js_shl(a.v, b.v)); }
inline ujs operator >>(ujs const &a, ujs const &b) { return ujs(js_shr(a.v, b.v)); }
inline ujs operator >(ujs const &a, ujs const &b) { return ujs(js_gt(a.v, b.v)); }
inline ujs operator <(ujs const &a, ujs const &b) { return ujs(js_lt(a.v, b.v)); }
inline ujs operator >=(ujs const &a, ujs const &b) { return ujs(js_ge(a.v, b.v)); }
inline ujs operator <=(ujs const &a, ujs const &b) { return ujs(js_le(a.v, b.v)); }
inline ujs operator ==(ujs const &a, ujs const &b) { return ujs(js_ee(a.v, b.v)); }
inline ujs operator !=(ujs const &a, ujs const &b) { return ujs(js_nn(a.v, b.v)); }
inline ujs operator +=(ujs const &a, ujs const &b) { return ujs(js_adde(a.v, b.v)); }
inline ujs operator -=(ujs const &a, ujs const &b) { return ujs(js_sube(a.v, b.v)); }
inline ujs operator *=(ujs const &a, ujs const &b) { return ujs(js_mule(a.v, b.v)); }
inline ujs operator /=(ujs const &a, ujs const &b) { return ujs(js_dive(a.v, b.v)); }
inline ujs operator %=(ujs const &a, ujs const &b) { return ujs(js_mode(a.v, b.v)); }
inline ujs operator &=(ujs const &a, ujs const &b) { return ujs(js_ande(a.v, b.v)); }
inline ujs operator |=(ujs const &a, ujs const &b) { return ujs(js_ore(a.v, b.v)); }
inline ujs operator ^=(ujs const &a, ujs const &b) { return ujs(js_xore(a.v, b.v)); }
inline ujs operator <<=(ujs const &a, ujs const &b) { return ujs(js_shle(a.v, b.v)); }
inline ujs operator >>=(ujs const &a, ujs const &b) { return ujs(js_shre(a.v, b.v)); }

inline ujs operator ""_js(unsigned long long x) {
  return ujs(x); }

inline ujs operator ""_js(long double x) {
  return ujs(static_cast<double>(x)); }

inline ujs operator ""_js(const char16_t *x, size_t n) {
  return ujs_string16(x, n); }

inline ujs operator ""_js(const char *x, size_t n) {
  return ujs_string8(x, n); }

#endif