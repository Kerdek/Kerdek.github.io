const f = Function

const pm = self.postMessage

self.onmessage = (e: MessageEvent<any>) => {
  pm(new f(e.data)()) }

delete self['close' as any]
delete self['postMessage' as any]