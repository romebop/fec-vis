/*
 * DashboardController
 *
 * Manages the application logic and event handling for the dashboard.
 * Instantiates the USCashMap and TransactionHistogram visualization widgets.
 *
 * @constructor
 * @params {d3.selection} mapSelection
 * @params {d3.selection} histogramSelection
 * @params {Object} dependencies
 */

var DashboardController = function(mapSelection, histogramSelection, dependencies) {
    // Instantiate event handling
    this.dispatch = d3.dispatch('mapselectionchange');
    this.dispatch.on('mapselectionchange', this.processChanges.bind(this));
    // NOTE: Binding necessary for `this` will not be bound by default to the dashboardcontroller
    this.dependencies = dependencies;

    // Instantiate the visualization widgets
    this.usCashMap = new USCashMap(
        mapSelection,
        dependencies.usTopoJSON,
        dependencies.convertIdToStateCode,
        dependencies.convertStateCodeToName,
        this.dispatch
    );

    this.transactionHistogram = new TransactionHistogram(histogramSelection, this.dispatch);

    // store data to render for performance
};

/*
 * firstLoad()
 *
 * Make the necessary requests for the transaction amounts data and summed transactions data.
 * Run firstProcess when it's done loading.
 */
DashboardController.prototype.firstLoad = function () {
    queue()
        .defer(d3.json, 'assets/data/all-transactions.json')
        .defer(d3.json, 'assets/data/summed-transactions.json')
        .await(this.firstProcess.bind(this));
};

/*
 * firstProcess(error, response0, response1)
 *
 * Store the responses for later use and render the the visualizations.
 * 
 * @params {Object} error
 * @params {JSON Blob} response0 is the response from '/fec/all_transaction_amounts'
 * @params {JSON Blob} response1 is the response from '/fec/summed_transactions'
 */
DashboardController.prototype.firstProcess = function (error, response0, response1) {
    // Store for later use
    this.allTransactions = response0['txn_amounts'];
    this.renderData = this.allTransactions // default
    this.stateTotalTransactions = response1['txn_totals'];

    // Render!
    this.usCashMap.render(this.stateTotalTransactions);
    this.transactionHistogram.render(this.allTransactions);
};

/**
 * processChanges()
 *
 * Event handler for a map selection change event.
 *
 * If the selection is not empty, filter all the transactions by the selected state(s)
 * and re-render the TransactionHistogram. When re-rendering the selected states, check
 * if the selection was due to a click event on the usCashMap. If click, rescale the
 * histogram such that the scaling of this histogram is with respect to the filtered data.
 * If the map selection change was not due to a click, then scale the histogram with
 * respect to all of the objects in this.allTransactions.
 *
 * DO NOT make another request to the server. Filter the data stored in `this.allTransactions`
 */
DashboardController.prototype.processChanges = function () {

    if (this.usCashMap.isSelectionClick() && this.usCashMap.hasSelection()) {
        // Selection was clicked
        // Make sure transaction histogram is rescaled to just the selection
        this.transactionHistogram.setScale(this.renderData);
        this.transactionHistogram.setHistogramColor(this.transactionHistogram.colorStates.SECONDARY);
    } else if (this.usCashMap.hasSelection()) {
        // Selection is just hovered upon
        // Use scale representing all of data (for a visually relative measure) 
        this.renderData = this.filterTransactionsByMapSelection();
        this.transactionHistogram.setScale(this.allTransactions);
        this.transactionHistogram.setHistogramColor(this.transactionHistogram.colorStates.PRIMARY);
    } else {
        // No user interaction
        // Process the map like normal
        this.renderData = this.allTransactions;
        this.transactionHistogram.setScale(this.allTransactions);
        this.transactionHistogram.setHistogramColor(this.transactionHistogram.colorStates.DEFAULT);
    }

    this.transactionHistogram.render(this.renderData);
};

/*
 * filterTransactionsByMapSelection()
 *
 * Filter the objects in the array `this.allTransactions` for objects that match the selected states
 * in `this.usCashMap`.
 *
 * @return {Array} list of objects filtered by the selected states in `this.USCashMap`'s state selection
 */
DashboardController.prototype.filterTransactionsByMapSelection = function () {

    function stateFilter(obj) {
        var states = this.usCashMap.getStatesInSelection();
        for (var i = 0; i < states.length; i++) {
            var state = states[i];
            if (obj['state'] !== state) return false;
        }
        return true;
    }

    return this.allTransactions.filter(stateFilter, this);
};