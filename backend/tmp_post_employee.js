const http = require('http');

const data = JSON.stringify({
  name: 'JOAO DA SILVA',
  document: '12312312312',
  email: 'JOAO@SILVA.COM',
  phone: '12211232112',
  position: 'vendedor',
  salary: 2300,
  hireDate: '2026-06-01',
  vacationStart: '',
  vacationEnd: '',
  companyId: '419cd433-f1f4-5281-afe3-5a4db76540ff',
  companyName: 'GDS Soluções ltda',
  createdByName: 'Divonei Brasileiro'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/employees',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

// Attach Authorization header if AUTH_TOKEN is provided in env
if (process.env.AUTH_TOKEN) {
  options.headers['Authorization'] = `Bearer ${process.env.AUTH_TOKEN}`;
}

const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    try {
      console.log('BODY', JSON.parse(body));
    } catch (e) {
      console.log('BODY', body);
    }
  });
});

req.on('error', (e) => console.error('REQUEST ERROR', e));
req.write(data);
req.end();
