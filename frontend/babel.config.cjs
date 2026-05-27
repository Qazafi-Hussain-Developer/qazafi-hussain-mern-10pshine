// babel.config.cjs
module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: 'auto'
    }],
    ['@babel/preset-react', { 
      runtime: 'automatic',
      importSource: 'react'
    }]
  ]
  // Remove the plugins section - it's optional
};