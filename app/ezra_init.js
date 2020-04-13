/* This file is part of Ezra Project.

   Copyright (C) 2019 - 2020 Tobias Klein <contact@ezra-project.net>

   Ezra Project is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   Ezra Project is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with Ezra Project. See the file LICENSE.
   If not, see <http://www.gnu.org/licenses/>. */

const app = require('electron').remote.app;
const path = require('path');
const fs = require('fs');

// This module will modify the standard console.log function and add a timestamp as a prefix for all log calls
require('log-timestamp');

// i18n
const i18n = require('i18next');
const I18nHelper = require('./app/helpers/i18n_helper.js');
const i18nHelper = new I18nHelper();

// This module checks for new releases on startup
const NewReleaseChecker = require('./app/helpers/new_release_checker.js');

// DB-related stuff
const DbHelper = require('./app/helpers/db_helper.js');
const userDataDir = app.getPath('userData');
const dbHelper = new DbHelper(userDataDir);
const dbDir = dbHelper.getDatabaseDir();

// Global instance of NodeSwordInterface used in many places
let nsi = null;

// UI Helper
const UiHelper = require('./app/helpers/ui_helper.js');
const uiHelper = new UiHelper();

var models = null;
var bible_browser_controller = null;
var tags_controller = null;
var reference_separator = ':';
var app_container_height = null;
var bible_chapter_verse_counts = {};

String.prototype.trim = function() {
  var s = this;
  s = s.replace(/(^\s*)|(\s*$)/gi,"");
  s = s.replace(/[ ]{2,}/gi," ");
  s = s.replace(/\n /,"\n");
  return s;
}

function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

$.create_xml_doc = function(string)
{
  var doc = (new DOMParser()).parseFromString(string, 'text/xml');
  return doc;
}

async function initI18N()
{
  await i18nHelper.init();
  //await i18n.changeLanguage('de');

  reference_separator = i18n.t('general.chapter-verse-separator');
  $(document).localize();
}

function initNSI()
{
  const NodeSwordInterface = require('node-sword-interface');
  nsi = new NodeSwordInterface();
  nsi.enableMarkup();
}

async function initDatabase()
{
  await dbHelper.initDatabase(dbDir);
  models = require('./models')(dbDir);
}

async function initControllers()
{
  bible_browser_controller = new BibleBrowserController();
  await bible_browser_controller.init();

  tags_controller = new TagsController();
}

function isMac()
{
  return navigator.platform.match('Mac') !== null;
}

function initUi()
{
  if (isMac()) {
    document.body.classList.add('OSX');
  }

  // Setup resizable function for divider between tags toolbox and verse list
  $('#bible-browser-toolbox').resizable({
    handles: 'e',
    resize: function(event, ui) {
      uiHelper.adaptVerseList();
    },
    stop: function(event, ui) {
      //console.log("Saving new tag list width: " + ui.size.width);
      bible_browser_controller.settings.set('tag_list_width', ui.size.width);
    }
  });

  // Open links classified as external in the default web browser
  $('body').on('click', 'a.external, p.external a', (event) => {
    event.preventDefault();
    let link = event.target.href;
    require("electron").shell.openExternal(link);
  });

  tags_controller.init_ui();
  uiHelper.configureButtonStyles();
  uiHelper.resizeAppContainer();
  $(window).bind("resize", () => { uiHelper.resizeAppContainer(); });
}

function showGlobalLoadingIndicator() {
  $('#main-content').hide();
  var loadingIndicator = $('#startup-loading-indicator');
  loadingIndicator.show();
  loadingIndicator.find('.loader').show();
}

function hideGlobalLoadingIndicator() {
  var loadingIndicator = $('#startup-loading-indicator');
  loadingIndicator.hide();
  $('#main-content').show();
}

function switchToDarkTheme() {
  switchToTheme('css/jquery-ui/dark-hive/jquery-ui.css');
  bible_browser_controller.notes_controller.setDarkTheme();
}

function switchToRegularTheme() {
  switchToTheme('css/jquery-ui/cupertino/jquery-ui.css');
  bible_browser_controller.notes_controller.setLightTheme();
}

function switchToTheme(theme) {
  var currentTheme = document.querySelector("#theme-css").href;

  if (currentTheme.indexOf(theme) == -1) { // Only switch the theme if it is different from the current theme
    document.querySelector("#theme-css").href = theme;
  }
}

function initNightMode() {
  var useNightMode = false;

  if (bible_browser_controller.settings.has('useNightMode')) {
    useNightMode = bible_browser_controller.settings.get('useNightMode');

    if (useNightMode) {
      console.log("Initializing night mode ...");
      bible_browser_controller.optionsMenu.useNightModeBasedOnOption(true);
    }
  }
}

function loadScript(src)
{
  var script = document.createElement('script');
  script.src = src;
  document.getElementsByTagName('head')[0].appendChild(script);
}

function loadScriptFileList(list)
{
  for (var i = 0; i < list.length; i++) {
    var script = list[i];
    loadScript(script);
  }
}

function loadAllScriptFiles()
{
  var appJsFiles = [
    "app/bible_browser/bible_browser_controller.js",
    "app/tags/tags_communication_controller.js",
    "app/tags/tags_controller.js",
    "templates/verse_list.js",
    "templates/tag_list.js"
  ];

  loadScriptFileList(appJsFiles);
}

// This function loads the content of html fragments into the divs in the app-container
function loadFragment(filePath, elementId) {
  var absoluteFilePath = path.join(__dirname, filePath);
  var fileContent = fs.readFileSync(absoluteFilePath);
  document.getElementById(elementId).innerHTML = fileContent;
}

function loadHTML()
{
  loadFragment('html/book_selection_menu.html',           'book-selection-menu');
  loadFragment('html/tag_selection_menu.html',            'tag-selection-menu');
  loadFragment('html/bible_browser_toolbox.html',         'bible-browser-toolbox');
  loadFragment('html/translation_settings_wizard.html',   'translation-settings-wizard');
  loadFragment('html/tab_search_form.html',               'tab-search');
  loadFragment('html/module_search_menu.html',            'module-search-menu');
  loadFragment('html/display_options_menu.html',          'display-options-menu');
  loadFragment('html/verse_list_tabs.html',               'verse-list-tabs');
  loadFragment('html/boxes.html',                         'boxes');
}

async function initApplication()
{
  //console.time("application-startup");
  var loadingIndicator = $('#startup-loading-indicator');
  loadingIndicator.show();
  loadingIndicator.find('.loader').show();

  console.log("Loading HTML fragments");
  loadHTML();

  console.log("Loading all script files");
  loadAllScriptFiles();

  console.log("Initializing i18n ...");
  await initI18N();

  console.log("Initializing database ...");
  await initDatabase();

  console.log("Initializing node-sword-interface ...");
  initNSI();

  console.log("Initializing controllers ...");
  await initControllers();

  console.log("Initializing user interface ...");
  initUi();

  initNightMode();

  // Show main content
  $('#main-content').show();

  await bible_browser_controller.translation_controller.installStrongsIfNeeded();

  console.log("Loading settings ...");
  await bible_browser_controller.loadSettings();

  console.log("Checking for latest release ...");
  var newReleaseChecker = new NewReleaseChecker('new-release-info-box');
  newReleaseChecker.check();

  loadingIndicator.hide();
  //console.timeEnd("application-startup");
}

$(document).ready(function() {
  initApplication();
});
