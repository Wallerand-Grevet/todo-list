(function (window) {
	'use strict';

	/**
	 * Prend un modèle et une vue et agit en tant que contrôleur entre eux
	 *
	 * @constructor
	 * @param {object} model The model instance
	 * @param {object} view The view instance
	 */
	function Controller(model, view) {
		var self = this;
		self.model = model;
		self.view = view;

		self.view.bind('newTodo', function (title) {
			self.addItem(title);
		});

		self.view.bind('itemEdit', function (item) {
			self.editItem(item.id);
		});

		self.view.bind('itemEditDone', function (item) {
			self.editItemSave(item.id, item.title);
		});

		self.view.bind('itemEditCancel', function (item) {
			self.editItemCancel(item.id);
		});

		self.view.bind('itemRemove', function (item) {
			self.removeItem(item.id);
		});

		self.view.bind('itemToggle', function (item) {
			self.toggleComplete(item.id, item.completed);
		});

		self.view.bind('removeCompleted', function () {
			self.removeCompletedItems();
		});

		self.view.bind('toggleAll', function (status) {
			self.toggleAll(status.completed);
		});
	}

	/**
	 * Charge et initialise la vue
	 *
	 * @param {string} '' | 'active' | 'completed'
	 */
	Controller.prototype.setView = function (locationHash) {
		var route = locationHash.split('/')[1];
		var page = route || '';
		this._updateFilterState(page);
	};

	/**
	 * un evenement a declencher au chargement.  Va chercher tous les objets et les afficher dans la
	 * todo-list
	 */
	Controller.prototype.showAll = function () {
		var self = this;
		self.model.read(function (data) {
			self.view.render('showEntries', data);
		});
	};

	/**
	 * Rend toutes les tâches actives
	 */
	Controller.prototype.showActive = function () {
		var self = this;
		self.model.read({ completed: false }, function (data) {
			self.view.render('showEntries', data);
		});
	};

	/**
	 * Rend toutes les tâches terminées
	 */
	Controller.prototype.showCompleted = function () {
		var self = this;
		self.model.read({ completed: true }, function (data) {
			self.view.render('showEntries', data);
		});
	};

	/**
	 * Un événement à déclencher chaque fois que vous souhaitez ajouter un élément. 
	 * Il suffit de passer l'objet event et il gérera l'insertion 
	 * et la sauvegarde du nouvel élément dans le DOM.
	 */
	Controller.prototype.addItem = function (title) {
		var self = this;

		if (title.trim() === '') {
			return;
		}

		self.model.create(title, function () {
			self.view.render('clearNewTodo');
			self._filter(true);
		});
	};

	/*
	 * Déclenche le mode d'édition d'élément.
	 */
	Controller.prototype.editItem = function (id) {
		var self = this;
		self.model.read(id, function (data) {
			self.view.render('editItem', {id: id, title: data[0].title});
		});
	};

	/*
	 * Termine le mode d'édition d'élément avec succès.
	 */
	Controller.prototype.editItemSave = function (id, title) {
		var self = this;

		while (title[0] === " ") {
			title = title.slice(1);
		}

		while (title[title.length-1] === " ") {
			title = title.slice(0, -1);
		}

		if (title.length !== 0) {
			self.model.update(id, {title: title}, function () {
				self.view.render('editItemDone', {id: id, title: title});
			});
		} else {
			self.removeItem(id);
		}
	};

	/*
	 * Annule le mode d'édition d'élément.
	 */
	Controller.prototype.editItemCancel = function (id) {
		var self = this;
		self.model.read(id, function (data) {
			self.view.render('editItemDone', {id: id, title: data[0].title});
		});
	};

	/**
	 * En lui attribuant un ID, il trouvera l’élément DOM correspondant à cet ID,
	 *  le supprimera du DOM et le retirera également du stockage.
	 * @param {number} id L'ID de l'élément à supprimer du DOM et du stockage
	 */
	Controller.prototype.removeItem = function (id) {
		var self = this;
		var items;
		self.model.read(function(data) {
			items = data;
		});

		// Boucle forEach inutile sur l'application sert juste a afficher que l'item a été effacer
		/*
		items.forEach(function(item) {
			if (item.id === id) {
				console.log("Element with ID: " + id + " has been removed.");
			}
		});
		*/

		self.model.remove(id, function () {
			self.view.render('removeItem', id);
		});

		self._filter();
	};

	/**
	 * Supprime tous les éléments terminés du DOM et du stockage.
	 */
	Controller.prototype.removeCompletedItems = function () {
		var self = this;
		self.model.read({ completed: true }, function (data) {
			data.forEach(function (item) {
				self.removeItem(item.id);
			});
		});

		self._filter();
	};

	/**
	 * Donnez-lui l'ID d'un modèle et une case à cocher et 
	 * il mettra à jour l'élément stocké en fonction de l'état de la case à cocher.
	 *
	 * @param {number} id L'ID de l'élément à compléter ou incomplet
	 * @param {object} checkbox La case à cocher pour vérifier si elle est cocher ou pas
	 * @param {boolean|undefined} silent Empêcher le re-filtrage des tâches
	 */
	Controller.prototype.toggleComplete = function (id, completed, silent) {
		var self = this;
		self.model.update(id, { completed: completed }, function () {
			self.view.render('elementComplete', {
				id: id,
				completed: completed
			});
		});

		if (!silent) {
			self._filter();
		}
	};

	/**
	 * Permet d'activer / désactiver toutes les cases à cocher et de compléter les modèles.
	 * Il suffit de passer dans l'objet événement.

	 */
	Controller.prototype.toggleAll = function (completed) {
		var self = this;
		self.model.read({ completed: !completed }, function (data) {
			data.forEach(function (item) {
				self.toggleComplete(item.id, completed, true);
			});
		});

		self._filter();
	};

	/**
	 * Met à jour les éléments de la page qui changent en fonction du nombre 
	 * de tâches restantes.
	 */
	Controller.prototype._updateCount = function () {
		var self = this;
		self.model.getCount(function (todos) {
			self.view.render('updateElementCount', todos.active);
			self.view.render('clearCompletedButton', {
				completed: todos.completed,
				visible: todos.completed > 0
			});

			self.view.render('toggleAll', {checked: todos.completed === todos.total});
			self.view.render('contentBlockVisibility', {visible: todos.total > 0});
		});
	};

	/**
	 * Re-filtre les éléments à faire en fonction de l'itinéraire actif.
	 * @param {boolean|undefined} force  oblige à redecorer les chose à faire.
	 */
	Controller.prototype._filter = function (force) {
		var activeRoute = this._activeRoute.charAt(0).toUpperCase() + this._activeRoute.substr(1);

		// Mettre à jour les éléments de la page, qui changent à chaque tâche terminée
		this._updateCount();

		// Si le dernier itinéraire actif n'est pas "Tous" ou si nous changeons d'itinéraire, 
		// nous recréons les éléments de l'élément à modifier en appelant:
		//   this.show[All|Active|Completed]();
		if (force || this._lastActiveRoute !== 'All' || this._lastActiveRoute !== activeRoute) {
			this['show' + activeRoute]();
		}

		this._lastActiveRoute = activeRoute;
	};

	/**
	 * Met simplement à jour les états sélectionnés du filtre de navigation
	 */
	Controller.prototype._updateFilterState = function (currentPage) {
		// Stocke une référence à la route active, 
		// ce qui nous permet de filtrer à nouveau les tâches à faire 
		// lorsqu'elles sont marquées comme complètes ou incomplètes.
		this._activeRoute = currentPage;

		if (currentPage === '') {
			this._activeRoute = 'All';
		}

		this._filter();

		this.view.render('setFilter', currentPage);
	};

	// Exporter vers le navigateur
	window.app = window.app || {};
	window.app.Controller = Controller;
})(window);