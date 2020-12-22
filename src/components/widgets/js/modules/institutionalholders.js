function institutionalholdersCallback(error, data, containerObject) {
    //debugger;
    require(['datatablesresponsive'], function () {
        var containerId = containerObject.attr('id');
        if (!$('#' + containerId + '-table').length) {
            var dataTable = $('<table>').attr('id', containerId + '-table').css('width', '100%').addClass('display responsive');
            containerObject.append(dataTable);
            $('#' + containerId + '-table').dataTable({
                'data': data,
                "columns": [
                    {
                        "data": "HolderName", title: "Holder", render: function (value, type, row) {
                            if (type == 'sort') return value;
                            else return '<a href="' + row.Url + '" target="_blank">' + value + '</a>';
                        }
                    },
                    { "data": "SharesHeld", title: "Shares" },
                    { "data": "SharesValue", title: "Value" }
                ],
                order: [[2, 'desc']]
            });
        } else {
            var dataTable = $('#' + containerId + '-table').DataTable();
            dataTable.clear();
            dataTable.rows.add(data);
            dataTable.draw();
        }
    });
}

function institutionalholders(list) { //function is intentionally not camelcase
    list = JSON.parse(list);
    _.each(list, function (value, key) {
        var container = 'ciq-' + value;
        var settings = defaultSettings.items[value];
        if (settings.message && settings.message.data && settings.message.data.symbol) {
			settings.symbol = settings.message.data.symbol;
		}
        var containerObject = $('#' + container);
        settings.id = key;
        if (!settings.symbol) settings.symbol = portalSettings.defaultSymbol;
        dataSources[portalSettings.dataSource].fetchInstitutionalHolders(settings, institutionalholdersCallback, containerObject);
        containerObject.show();
    });
    PortalCore.addStyleSheet('https://cdn.jsdelivr.net/jquery.datatables/1.10.10/css/jquery.dataTables.min.css');
    PortalCore.addStyleSheet('https://cdn.jsdelivr.net/jquery.datatables/1.10.10/plugins/responsive/css/responsive.dataTables.min.css');
}