module.exports = {
  apps: [
    {
      name: 'ZCMS',
      script: 'build/index.js',
      watch: true,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
}
