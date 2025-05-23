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

'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('BibleTranslations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(5)
      },
      name: {
        type: Sequelize.STRING
      },
      language: {
        type: Sequelize.STRING
      },
      isFree: {
        type: Sequelize.BOOLEAN
      },
      versification: {
        type: Sequelize.ENUM('ENGLISH', 'HEBREW')
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('BibleTranslations');
  }
};
