module.exports = {
  apps: [
    {
      name: 'ZCMS',
      script: 'build/index.js',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
