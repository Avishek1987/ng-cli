// Generated by CoffeeScript 1.8.0
(function() {
  "use strict";
  var BundledCommands, Helpers, findup, fs, helpers, inquirer, path, shelljs;

  path = require("path");

  Helpers = require("./helpers");

  helpers = new Helpers();

  fs = require("fs");

  inquirer = require("inquirer");

  shelljs = require("shelljs");

  findup = require("findup");


  /**
    @class BundledCommands
    @description All bundled commands are invoked from here.
   */

  BundledCommands = (function() {
    function BundledCommands() {}


    /**
      @method addon
      @param args {Object} Command line arguments object
      @description Bundled command to create addon blueprint
     */

    BundledCommands.prototype.addon = function(args) {

      /**
        Addon blueprint
       */
      var directory_path, git_addon_path;
      git_addon_path = "https://github.com/ngCli/ngcli-addon-blueprint.git";
      if (args.name) {
        directory_path = path.join(process.cwd(), args.name);
        fs.exists(directory_path, function(exists) {
          if (exists) {
            helpers.lineup.log.error("" + args.name + " already exists at " + directory_path);
            process.exit(1);
          } else {
            helpers.clone(git_addon_path, directory_path, function() {
              shelljs.cd(directory_path);
              shelljs.exec("rm -rf .git");
              shelljs.exec("npm install", function() {
                helpers.lineup.log.success("Created addon at path " + directory_path);
              });
            });
          }
        });
      } else {
        helpers.lineup.log.error("enter addon name as ng addon <name>");
      }
    };


    /**
      @method newApp
      @param args {Object} Command line arguments object
      @description Bundled command to create new ngCli app
     */

    BundledCommands.prototype.newApp = function(args) {
      var blueprints_question, directory_path, git_paths, git_questions, self;
      self = this;

      /**
        Inquirer object to prompts
       */
      blueprints_question = {
        type: "list",
        name: "blueprint",
        message: "Select project blueprint",
        choices: [
          {
            name: "Default template",
            value: "default"
          }, {
            name: "Ui Router template",
            value: "ui-router"
          }, {
            name: "Your own template from git",
            value: "git-pull"
          }
        ]
      };

      /**
        Git paths from templates name
       */
      git_paths = {
        "ui-router": "https://github.com/ngCli/ngcli-ui.router-blueprint.git",
        "default": "https://github.com/ngCli/ngcli-default-blueprint.git"
      };

      /**
        Question to ak if user choice is git-pull
       */
      git_questions = {
        type: "input",
        name: "git-path",
        message: "Enter git url to pull from",
        validate: function(value) {
          if (value.trim().length > 0) {
            return true;
          } else {
            return false;
          }
        }
      };

      /**
        Looking if name of the project was passed
       */
      if (args.name) {
        directory_path = path.join(process.cwd(), args.name);

        /**
          @note Checking for directory existence
         */
        fs.exists(directory_path, function(exists) {
          if (exists) {
            helpers.lineup.log.error("" + args.name + " already exists at " + directory_path);
            process.exit(1);
          } else {

            /**
              @note Asking project blueprint question
             */
            return inquirer.prompt(blueprints_question, function(answers) {

              /**
                @note If answer is git-pull , ask for git path
                and run clone on top of it
               */
              var git_path;
              if (answers.blueprint === "git-pull") {
                inquirer.prompt(git_questions, function(answers) {

                  /**
                    @note Clone blueprint from custom path to project directory
                   */
                  var git_path;
                  git_path = answers["git-path"];
                  self.cloneProjectBluePrint(git_path, directory_path);
                });
              } else {

                /**
                  @note Clone selected blueprint to project directory
                 */
                git_path = git_paths[answers.blueprint];
                self.cloneProjectBluePrint(git_path, directory_path);
              }
            });
          }
        });
      } else {
        helpers.lineup.log.error("enter app name as ng new <name>");
      }
    };


    /**
      @method cloneProjectBluePrint
      @param blueprint {String} Blueprint path to clone from git
      @param directory_path {String} Directory path to clone into
     */

    BundledCommands.prototype.cloneProjectBluePrint = function(blueprint, directory_path) {
      helpers.clone(blueprint, directory_path, function() {
        shelljs.cd(directory_path);
        shelljs.exec("rm -rf .git");
        helpers.lineup.action.success("install", "installing using npm");
        shelljs.exec("npm install", function() {
          helpers.lineup.action.success("install", "installing using bower");
          shelljs.exec("bower install", function() {
            helpers.lineup.log.success("Created");
            helpers.lineup.highlight.start("NEXT STEPS");
            console.log("cd " + directory_path);
            console.log("ng -h to list all command");
            helpers.lineup.highlight.end();
          });
        });
      });
    };


    /**
      Simply run ng-task-runner inside node modules of app
     */

    BundledCommands.prototype.buildApp = function() {
      shelljs.cd(process.cwd());

      /**
        Make sure to use exec async by passing callback
        as sync version will eat the entire CPU
       */
      return shelljs.exec("node node_modules/ngcli-task-runner/index.js --build", function(code, output) {
        if (code !== 0) {
          return helpers.lineup.log.error(output);
        }
      });
    };


    /**
      Install addons using npm , require it and run afterInstall function
      if exists
     */

    BundledCommands.prototype.installAddon = function(args) {
      findup(process.cwd(), "package.json", function(err, dir) {
        if (err) {
          helpers._terminate(err);
          return;
        }
        shelljs.cd(dir);
        shelljs.exec("npm install " + args.name + " --save", function(code) {
          var addon_path, getInstalledAddon, packageFile;
          if (code === 0) {

            /** All good */

            /**
              Set as ngAddon inside package json
             */
            packageFile = require("" + dir + "/package.json");
            packageFile["ng-addons"] = packageFile["ng-addons"] || {};
            packageFile["ng-addons"]["" + args.name] = args.name;
            packageFile = JSON.stringify(packageFile, null, 2);
            fs.writeFileSync("" + dir + "/package.json", packageFile);

            /**
              Require installed addon and run after install method
             */
            addon_path = path.join(dir, "node_modules/" + args.name);
            getInstalledAddon = require(addon_path);
            if (typeof getInstalledAddon.afterInstall === "function") {
              getInstalledAddon.afterInstall();
              return;
            }
          } else {
            helpers.lineup.log.error("npm install failed");
          }
        });
      });
    };


    /**
      Simply run ng-task-runner inside node modules of app
     */

    BundledCommands.prototype.serveApp = function() {
      shelljs.cd(process.cwd());

      /**
        Make sure to use exec async by passing callback
        as sync version will eat the entire CPU
       */
      return shelljs.exec("node node_modules/ngcli-task-runner/index.js --serve", function(code, output) {
        if (code !== 0) {
          return helpers.lineup.log.error(output);
        }
      });
    };


    /**
      Run karma unit tests
     */

    BundledCommands.prototype.karmaStart = function() {
      shelljs.cd(process.cwd());

      /**
        Make sure to use exec async by passing callback
        as sync version will eat the entire CPU
       */
      return shelljs.exec("node node_modules/ngcli-task-runner/index.js --test", function(code, output) {
        if (code !== 0) {
          return helpers.lineup.log.error(output);
        }
      });
    };

    return BundledCommands;

  })();

  module.exports = BundledCommands;

}).call(this);
