/* This file is part of Ezra Bible App.

   Copyright (C) 2019 - 2025 Ezra Bible App Development Team <contact@ezrabibleapp.net>

   Ezra Bible App is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 2 of the License, or
   (at your option) any later version.

   Ezra Bible App is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with Ezra Bible App. See the file LICENSE.
   If not, see <http://www.gnu.org/licenses/>. */

/**
 * This module contains utility functions that are used through the app
 * @module ezraHelper
 * @category Utility
 */

module.exports.sleep = async function (time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

module.exports.waitUntilIdle = async function () {
  return new Promise(resolve => {
    window.requestIdleCallback(() => {
      resolve();
    });
  });
};

module.exports.getPlatform = function() {
  var platform = null;

  if (platformHelper.isElectron()) {
    platform = window.electronPlatform;
  } else if (platformHelper.isAndroid()) {
    platform = window.cordovaPlatform;
  }

  return platform;
};

// based on https://stackoverflow.com/questions/3115150/how-to-escape-regular-expression-special-characters-using-javascript
module.exports.escapeRegExp = function (text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/**
 * This little function gives us the possibility for html tagged template literals.
 * 
 * Note that if we ever introduce a library like lit we may need to remove this function, because there would otherwise be a
 * clash in the global namespace.
 * 
 * proof of concept; utilizing tagged templates https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
 */
module.exports.html = (literals, ...substs) => {
  const template = document.createElement('template');
  // based upon https://github.com/AntonioVdlC/html-template-tag/blob/main/src/index.ts
  template.innerHTML = literals.raw.reduce((acc, lit, i) => {
    let subst = substs[i - 1];
    if (Array.isArray(subst)) {
      subst = subst.join("");
    }
    return acc + subst + lit;
  });

  return template;
};

/**
 * This function parses string into HTML fragment
 */
// module.exports.parseHTML = Range.prototype.createContextualFragment.bind(document.createRange());
module.exports.parseHTML = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

module.exports.removeItemFromArray = function(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }

  return arr;
};

/**
 * This function shows a modal dialog to the user.
 *  
 * @param {string} dialogTitle The title of the dialog
 * @param {string} message The message that shall be displayed
 * @returns {Promise} A promise that resolves when the user confirms/closes the dialog
 */
module.exports.showDialog = async function(dialogTitle, message, width=500, height=300) {
  const dialogBoxTemplate = module.exports.html`
  <div id="info-dialog">
    <div id="info-dialog-content" style="padding-top: 2em;">
    ${message}
    </div>
  </div>
  `;

  return new Promise((resolve) => {

    document.querySelector('#boxes').appendChild(dialogBoxTemplate.content);
    const $dialogBox = $('#info-dialog');
    
    var confirmed = false;
    const offsetLeft = ($(window).width() - width)/2;

    let dialogOptions = window.uiHelper.getDialogOptions(width, height, false, [offsetLeft, 120]);
    dialogOptions.dialogClass = 'ezra-dialog info-dialog';
    dialogOptions.title = dialogTitle;
    dialogOptions.buttons = {};
    dialogOptions.modal = true;
    dialogOptions.close = () => {
      $dialogBox.dialog('destroy');
      $dialogBox.remove();
      resolve(confirmed);
    };

    dialogOptions.buttons[i18n.t('general.ok')] = function() {
      confirmed = true;
      $(this).dialog('close');
    };
  
    $dialogBox.dialog(dialogOptions);
    window.uiHelper.fixDialogCloseIconOnAndroid('info-dialog');
  });
};