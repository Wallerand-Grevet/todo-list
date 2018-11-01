/*jshint eqeqeq:false */
(function (window) {
	'use strict';

	/**
	 * Crée un nouvel objet de stockage côté client et
	 * créera une collection vide si aucune collection n'existe déjà.
	 *
	 * @param {string} name Le nom de notre base de données que nous voulons utiliser
	 * @param {function} callback Notre fausse base de données utilise des rappels, car dans la vie réelle, 
	 * vous effectueriez probablement des appels AJAX.
	 */
	function Store(name, callback) {
		callback = callback || function () {};

		this._dbName = name;

		if (!localStorage[name]) {
			var data = {
				todos: []
			};

			localStorage[name] = JSON.stringify(data);
		}

		callback.call(this, JSON.parse(localStorage[name]));
	}

	/**
	 * Trouve les éléments en fonction d'une requête donnée en tant qu'objet JS
	 *
	 * @param {object} query La requête à faire correspondre (i.e. {foo: 'bar'})
	 * @param {function} callback	 Le rappel à déclencher lorsque la requête 
	 * est en cours d'exécution
	 *
	 * @example
	 * db.find({foo: 'bar', hello: 'world'}, function (data) {
	 *	 // les données renverront tous les éléments qui ont foo: bar et
	 *	 // hello: world dans leurs propriétés
	 * });
	 */
	Store.prototype.find = function (query, callback) {
		if (!callback) {
			return;
		}

		var todos = JSON.parse(localStorage[this._dbName]).todos;

		callback.call(this, todos.filter(function (todo) {
			for (var q in query) {
				if (query[q] !== todo[q]) {
					return false;
				}
			}
			return true;
		}));
	};

	/**
	 * Récupérera toutes les données de la collection
	 *
	 * @param {function} callback Le rappel a declencher lors de la récupération des données
	 */
	Store.prototype.findAll = function (callback) {
		callback = callback || function () {};
		callback.call(this, JSON.parse(localStorage[this._dbName]).todos);
	};

	/**
	 * Sauvegardera les données données dans la base de données. Si aucun élément n'existe,
	 * il créera un nouvel élément, 
	 * sinon il ne fera que mettre à jour les propriétés d'un élément existant.
	 *
	 * @param {object} updateData Les données à sauvegarder dans la base de données
	 * @param {function} callback Le rappel a declencher après la sauvegarde
	 * @param {number} id Un paramètre optionnel pour entrer l'ID d'un élément à mettre à jour
	 */

	Store.prototype.save = function (updateData, callback, id) {
		var data = JSON.parse(localStorage[this._dbName]);
		var todos = data.todos;

		callback = callback || function () {};

		// Generation d'un ID


	    /*var newId = ""; 
	    var charset = "0123456789";

        for (var i = 0; i < 6; i++) {
     		newId += charset.charAt(Math.floor(Math.random() * charset.length));
		}
		*/
		
		// generation d'un id selon la longueur du tableau todos
		if (todos.length>0) {
			var longTab = todos.length - 1
			var ancienId = todos[longTab].id
			var newId = ancienId + 1;
		} else{
			newId = 1
		}
		
		var newIdwaL = new Date().getTime(); // renvoie le nombre de millisecondes écoulées depuis le 1er janvier 1970
		
		// Si un identifiant a été donné, trouvez l'élément et mettez à jour chaque propriété
		if (id) {
			for (var i = 0; i < todos.length; i++) {
				if (todos[i].id === id) {
					for (var key in updateData) {
						todos[i][key] = updateData[key];
					}
					break;
				}
			}

			localStorage[this._dbName] = JSON.stringify(data);
			callback.call(this, todos);
		} else {

    		// Attribuer un identifiant
			updateData.id = parseInt(newId);
    

			todos.push(updateData);
			console.log(todos)
			localStorage[this._dbName] = JSON.stringify(data);
			callback.call(this, [updateData]);
		}
	};

	/**
	 * Supprime un article du magasin en fonction de son identifiant
	 *
	 * @param {number} id L'ID de l'élément que vous souhaitez supprimer
	 * @param {function} callback Le rappel a declencher après la sauvegarde
	 */
	Store.prototype.remove = function (id, callback) {
		var data = JSON.parse(localStorage[this._dbName]);
		var todos = data.todos;
		var todoId;
		
		for (var i = 0; i < todos.length; i++) {
			if (todos[i].id == id) {
				todoId = todos[i].id;
			}
		}

		for (var i = 0; i < todos.length; i++) {
			if (todos[i].id == todoId) {
				todos.splice(i, 1);
			}
		}

		localStorage[this._dbName] = JSON.stringify(data);
		callback.call(this, todos);
	};

	/**
	 * Laisse tomber tout le stockage and prend un nouveau depart
	 *
	 * @param {function} callback le rappel a declencher après la chute des données
	 */
	Store.prototype.drop = function (callback) {
		var data = {todos: []};
		localStorage[this._dbName] = JSON.stringify(data);
		callback.call(this, data.todos);
	};

	// Export to window
	window.app = window.app || {};
	window.app.Store = Store;
})(window);