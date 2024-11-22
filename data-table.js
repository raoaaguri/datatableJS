const DataTable = (function() {
    //Mandatory props to be passed 
    let _tableContainer = null; // This is where I will store the value passed as table container.. TYPE == String
    let _apiEndPoint = null; // This will hold the API endpoint URL.. TYPE == String
    let _columns = []; /*    Pass array of column names that you want to see as column get this column values from API endpoint Data.. 
                            This can be a array of objects where we can pass name as column label, key as column value and sort if needed
                            This can also pass if the children is true or not.*/

    //optional props 
    let _fixedHeader = false; // This will hold if we want Fixed header or not.. TYPE == Boolean
    let _fixedColumns = []; // This will take the columns which need to be fixed position even after the scroll..
    let _fixedColumn = false;
    let _sort = false; // This will unable sort option on all the columns 
    let _search = false; // This is a search functionality on the table data
    let _pagination = null; /*This flag will represent if pagination is enabled or not and it is a type of object 
                            {type: "numbers or next and previous buttons or both", position: "top right/ top left/ top center/ bottom right/ bottom left / bottom center", show: true}
                            */
    let _paginationContainer = null;
    let _paginationOptions = [];
    let _filter = false;
    let _filterContiner = null;
    let _filterColumns  = [];                     
    let _rowActions = null; // This will have list of actions that can be performed per row [{type: "edit", action: "method name", apiCall: "endpoint"}]

    let currentSortColumn = null;
    let isAscending = true;

    let currentPage = 1;
    let recordsPerPage = 10;

    let apiData = []; // Global variable to store fetched data

    let filteredData = []; // Data to display after filtering
    let filters = {}; // Store filter values

    const init = function(initializeData) {
        _tableContainer = initializeData.tableContainer;
        _apiEndPoint = initializeData.apiEndPoint;
        _columns = initializeData.columns;

        _fixedHeader = initializeData.fixedHeader;
        _fixedColumn = initializeData._fixedColumn;
        _sort = initializeData.sort;
        _search = initializeData.search;

        //Paginations setting
        _pagination = initializeData.pagination;
        _paginationContainer = initializeData.paginationContainer
        _paginationOptions = initializeData.paginationOptions;

        //Filter settings
        _filter = initializeData.filter;
        _filterContiner = initializeData.filterContainer;
        _filterColumns  = initializeData.filterColumns;     

        _rowActions = initializeData.rowActions;

        if(_filter) {
            renderFilterOptions();
        }
       

        fetchData();
    }

    // Function to sort data and re-render the table
    const sortTable = function(columnKey) {
        // Toggle sort direction if the same column is clicked again
        if (currentSortColumn === columnKey) {
            isAscending = !isAscending;
        } else {
            currentSortColumn = columnKey;
            isAscending = true;
        }

        // Sort data based on the columnKey and direction
        filteredData.sort((a, b) => {
            if (a[columnKey] < b[columnKey]) return isAscending ? -1 : 1;
            if (a[columnKey] > b[columnKey]) return isAscending ? 1 : -1;
            return 0;
        });

        currentPage = 1; // Reset to first page after sorting

        // Re-render the table with sorted data
        createTable(filteredData);

        // Update the sort indicator on the column headers
        updateSortIndicator(columnKey);
        
    }

    //Function to render filter options
    const renderFilterOptions = function () {
        let filterHTML = `<div class="filter-container" id="filter-container"></div>
                                <button class="apply-filters" onclick="DataTable.applyFilters()">Apply Filters</button>
                                <button class="clear-filters" onclick="DataTable.clearAllFilters()">Clear All Filters</button>
                                <div class="active-filters" id="active-filters"></div>`;
        document.getElementById(_filterContiner).innerHTML = filterHTML;                        
    }

    //Function to render show records list
    const renderRecordList = function () {
        let tableRecordList = `<div class="records-per-page">
                                <label for="recordsPerPage">Records per page: </label>
                                <select id="recordsPerPage">`;
            _paginationOptions.forEach(option => {
                tableRecordList +=  `<option value="${option}">${option}</option>`
            })                        
            tableRecordList += `</select>
                                </div><div id="pagination" class="pagination"></div>`;
        document.getElementById(_paginationContainer).innerHTML = tableRecordList;  
        
         // Handle records per page changes
         document.getElementById('recordsPerPage').addEventListener('change', (e) => {
            recordsPerPage = parseInt(e.target.value);
            currentPage = 1; // Reset to first page when records per page changes
            createTable(apiData);
        });
    }

    // Function to update sort indicator on headers
    const updateSortIndicator = function (columnKey) {
        document.querySelectorAll('Data__Table--HeaderRow').forEach(th => th.classList.remove('sort-asc', 'sort-desc'));
        const header = document.querySelector(`div[data-key="${columnKey}"]`);
        header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
    }

    // Function to navigate to a specific page
    const goToPage = function (page) {
        currentPage = page;
        createTable(filteredData);
    }


     // Function to render pagination controls
    const renderPagination = function () {
        const paginationContainer = document.getElementById('pagination');
        const totalPages = Math.ceil(filteredData.length / recordsPerPage);
        paginationContainer.innerHTML = '';

        if (currentPage > 1) {
            paginationContainer.innerHTML += `<button onclick="DataTable.goToPage(${currentPage - 1})">Prev</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.innerHTML += `<button onclick="DataTable.goToPage(${i})">${i}</button>`;
        }

        if (currentPage < totalPages) {
            paginationContainer.innerHTML += `<button onclick="DataTable.goToPage(${currentPage + 1})">Next</button>`;
        }
    }

     // Apply filters to the data
    const applyFilters = function () {
        filteredData = apiData.filter(row => {
            return _columns.every(column => {
                const key = column.key;
                const filterValue = filters[key] || '';
                const cellValue = row[key]?.toString().toLowerCase() || '';
                return cellValue.includes(filterValue);
            });
        });

        currentPage = 1; // Reset to first page after applying filters
        createTable(filteredData);
        showActiveFilters();
    }

     // Function to create filter inputs for each column
    const createFilterInputs = function (columns) {
        const filterContainer = document.getElementById('filter-container');
        filterContainer.innerHTML = '';
        columns.forEach(column => {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Filter by ${column.label}`;
            input.dataset.key = column.key;
            input.addEventListener('input', (e) => {
                filters[e.target.dataset.key] = e.target.value.trim().toLowerCase();
            });
            filterContainer.appendChild(input);
        });
    }

     // Function to show active filters
    const showActiveFilters = function () {
        const activeFiltersContainer = document.getElementById('active-filters');
        activeFiltersContainer.innerHTML = '';

        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                const filterDiv = document.createElement('div');
                filterDiv.textContent = `${_columns.find(col => col.key === key).label}: ${filters[key]}`;
                const clearButton = document.createElement('button');
                clearButton.textContent = 'x';
                clearButton.onclick = () => clearFilter(key);
                filterDiv.appendChild(clearButton);
                activeFiltersContainer.appendChild(filterDiv);
            }
        });
    }

    // Function to clear a specific filter
    const clearFilter = function (key) {
        filters[key] = '';
        document.querySelector(`input[data-key="${key}"]`).value = '';
        applyFilters();
    }

    // Function to clear all filters
    const clearAllFilters = function () {
        filters = {};
        document.querySelectorAll('.filter-container input').forEach(input => input.value = '');
        applyFilters();
    }


    const fetchData = function() {

        const apiUrl = _apiEndPoint;
        //const outputElement = document.getElementById('output');
        debugger;

        fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Display data in an HTML element
            apiData = data;

            filteredData = data; // Initialize filteredData with all data

            // Render record list only if pagination option is true..
            if(_pagination) {
                renderRecordList();
            }
            
            createTable(filteredData);

            // Handle records per page changes
            document.getElementById('recordsPerPage').addEventListener('change', (e) => {
                recordsPerPage = parseInt(e.target.value);
                currentPage = 1; // Reset to first page when records per page changes
                createTable(filteredData);
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    const createTable = function(data) {
        console.log(data);
        let dataToRender = data;
        if(_pagination) {
            const startIdx = (currentPage - 1) * recordsPerPage;
            const endIdx = startIdx + recordsPerPage;
            dataToRender = data.slice(startIdx, endIdx);
        } 


        let fixedColumn = _fixedColumn ? "fixed-column" : "";
        let fixedHeader = _fixedHeader ? "sticky" : ""

        if(_filter) {
            createFilterInputs(_filterColumns);
        }
        

        let tableWidth = 0;

        let tableHTML = `<div class="Data__Table--Container">`;
            
            let tableHeaderHTML = `<div class="Data__Table--HeaderRow Data__Table--Row ${fixedHeader}">
                                        <div class="Data__Table--HeaderCell Data__Table--Cell ${fixedColumn}">
                                            <input type="checkbox" class="select-all" name="horns" />
                                        </div>`;
            _columns.forEach((column) => {
                tableWidth  = tableWidth + parseInt(column.width); 
                tableHeaderHTML += `<div class="Data__Table--HeaderCell Data__Table--Cell" style="width:${column.width}" ${column.sort ? `data-key="${column.key}"` : ''}>
                                        <span class="Table__Cell--Item"> ${column.label} </span> 
                                    </div>`;
            });

            tableHeaderHTML += `</div>`;

            tableHTML += `  ${tableHeaderHTML}`;

            tableHTML += dataToRender.map(row => {
                            return `<div class="Data__Table--Row"> 
                                        <div class=" Data__Table--Cell ${fixedColumn}">
                                            <input type="checkbox" class="select-item" name="horns" />
                                        </div>`
                                            +
                                        _columns.map(column => {
                                            const cellValue = row[column.key] || '';
                                            const renderedValue = column.render ? column.render(cellValue) : cellValue;
                                            return `<div class="Data__Table--Cell" style="width:${column.width}px">
                                                <span class="Table__Cell--Item">${renderedValue}</span>
                                            </div>`
                                        } 
                                    ).join('') + '</div>';
                        }).join('');
            
            tableHTML += `</div>`;            

        tableHTML += `</div>`;

        document.getElementById(_tableContainer).innerHTML = tableHTML;
        document.querySelector(".Data__Table--Container").style.width = tableWidth + 'px';
        
        _columns.forEach(column => {
            if (column.sort) {
                document.querySelector(`div[data-key="${column.key}"]`).addEventListener('click', () => {
                    sortTable(column.key);
                });
            }
        });

        // Render pagination controls only if pagination option is true..
        if(_pagination) {
            renderPagination();
        }
    }

    return {
        init: init,
        goToPage: goToPage,
        applyFilters: applyFilters,
        clearAllFilters: clearAllFilters
    }

})();