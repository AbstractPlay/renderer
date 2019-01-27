const gulp = require('gulp');
const tsPipeline = require('gulp-webpack-typescript-pipeline');

tsPipeline.registerBuildGulpTasks(
  gulp,
  {
    entryPoints: {
      "APRender": __dirname + "/build/index.js"
    },
    outputDir: __dirname + "/dist"
  }
);
