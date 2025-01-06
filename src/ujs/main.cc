#include "ujs.hh"

extern "C" js invoke_value(size_t i, size_t f, js x) {
  return reinterpret_cast<js (*)(size_t, js)>(i)(f, x); }

extern "C" void invoke_void(size_t i, size_t f, js x) {
  return reinterpret_cast<void (*)(size_t, js)>(i)(f, x); }

extern "C" int main(){
  ujs window = ujs_window();
  window["mean"_js] = ujs_closure([=](ujs y) mutable {
    return ujs_closure([=](ujs x) mutable {
      window["console"_js]["log"_js]((x[0_js] + y[0_js]) / 2.0_js);
      return "thanks"_js; }); });
  return 0; }