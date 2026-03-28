# Gyors telepítési útmutató - Quick Installation Guide

```cmd
git clone https://github.com/ENCarina/EPort.git
cd EPApi
npm install
node op conf:generate
node op key:generate
node op migrate
node op db:seed
npm run dev
```