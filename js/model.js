(function (window) {
	'use strict';

	/**
	 * Crée une nouvelle instance de modèle et raccorde le stockage.
	 *
	 * @constructor
	 * @param {object} storage Une référence à la classe de stockage côté client
	 */
	function Model(storage) {
		this.storage = storage;
	}

	/**
	 * Crée un nouveau modèle de tâche
	 *
	 * @param {string} [title] Le titre de la tâche
	 * @param {function} [callback] Le rappel à déclencher après la création du modèle
	 */
	Model.prototype.create = function (title, callback) {
		title = title || '';
		callback = callback || function () {};

		var newItem = {
			title: title.trim(),
			completed: false
		};

		this.storage.save(newItem, callback);
	};

	/**
	 * Trouve et retourne un modèle stocké. Si aucune requête n'est donnée, 
	 * tout sera simplement retourné. Si vous transmettez une chaîne ou un nombre, 
	 * il le recherchera en tant qu'ID du modèle à rechercher. 
	 * Enfin, vous pouvez lui transmettre un objet à comparer.
	 *
	 * @param {string|number|object} [query] Une requête pour faire correspondre les modèles
	 * @param {function} [callback] Le rappel a declencher après la découverte du modèle
	 *
	 * @example
	 * model.read(1, func); // Trouvera le modèle avec un ID de 1
	 * model.read('1'); // Comme ci-dessus
	 * //Vous trouverez ci-dessous un modèle avec foo === bar and hello === world.
	 * model.read({ foo: 'bar', hello: 'world' });
	 */
	Model.prototype.read = function (query, callback) {
		var queryType = typeof query;
		callback = callback || function () {};

		if (queryType === 'function') {
			callback = query;
			return this.storage.findAll(callback);
		} else if (queryType === 'string' || queryType === 'number') {
			query = parseInt(query, 10);
			this.storage.find({ id: query }, callback);
		} else {
			this.storage.find(query, callback);
		}
	};

	/**
	 * Met à jour un modèle en lui attribuant un ID, des données à mettre à jour
	 * et un rappel à déclencher une fois la mise à jour terminée.
	 * @param {number} id L'identifiant du modèle à mettre à jour
	 * @param {object} data Les propriétés à mettre à jour et leur nouvelle valeur
	 * @param {function} callback Le rappel à déclencher lorsque la mise à jour est terminée.
	 */
	Model.prototype.update = function (id, data, callback) {
		this.storage.save(data, callback, id);
	};

	/**
	 * Supprime un modèle de la mémoire
	 *
	 * @param {number} id L'ID du modèle à supprimer
	 * @param {function} callback Le rappel a declencher lorsque le retrait est terminé.
	 */
	Model.prototype.remove = function (id, callback) {
		this.storage.remove(id, callback);
	};

	/**
	 * WARNING: Supprime TOUTES les données de la mémoire.
	 *
	 * @param {function} callback Le rappel a declencher lorsque le stockage est effacé.
	 */
	Model.prototype.removeAll = function (callback) {
		this.storage.drop(callback);
	};

	/**
	 * Retourne le nombre de tous les todos
	 */
	Model.prototype.getCount = function (callback) {
		var todos = {
			active: 0,
			completed: 0,
			total: 0
		};

		this.storage.findAll(function (data) {
			data.forEach(function (todo) {
				if (todo.completed) {
					todos.completed++;
				} else {
					todos.active++;
				}

				todos.total++;
			});
			callback(todos);
		});
	};

	// Export to window
	window.app = window.app || {};
	window.app.Model = Model;
})(window);
