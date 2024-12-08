# External IPs
This is Node.js module to use many IPs in HTTP(s) requests or WS.
It may be useful to avoid rate limits in some external IPs or when you parsed some site.

## Usage
You need buy additionals IPs in hosting
Then add it in Linux: https://askubuntu.com/questions/585468/how-do-i-add-an-additional-ip-address-to-an-interface-in-ubuntu-14


### Base
```js
  const IPs  = require('external-ips');
  
  console.log('all',  IPs.length);
  console.log('IPv4', IPs.v4.length);
  console.log('IPv6', IPs.v6.length);
  
  console.log(IPs.v4.next());
  console.log(IPs.v4.next());
  
  console.log(IPs.v4.random());  
```

### HTTP/HTTPs
```js
  const http = require('node:http');
  ...
  http.request(url, {
    localAddress: IPs.v4.next(),
             //or IPs.v4.random(),
    })
  });
```

### WS
```js
  ...	
  const WS = require('ws');
  ...  
  new WS(address, protocols, {
	localAddress: IPs.v4.next()
  })
```

### Agent
```js
  ...  
  const agent = new https.Agent();
  ...
  IPs.v4.patchAgent(agent);
```

#### multi family
```js
  ...
  IPs.patchAgent(agent, 4); 
```


#### Fixed IPs

```js
  ...  
  const agent1 = new http.Agent();
  const agent2 = new http.Agent();
  ...
  IPs.v4._next().patchAgent(agent1); //or _random()
  IPs.v4._next().patchAgent(agent2); //or _random()  
```