const https = require('https');

https.get('https://docs.google.com/forms/d/e/1FAIpQLSfJ2UOUBezt8PGgQq-MgLtqQ_hQEQA3uTQHXUoCaWf3DYm_yw/viewform?usp=dialog', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/\[[0-9]{8,10},"[^"]*",null,[0-9],\[\[[0-9]{8,10}/g);
    console.log(matches);
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
