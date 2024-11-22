const data_table_columns = [
    {   
        'key': 'alpha_two_code', 
        'label': 'Alpha Two Code', 
        'sort': false, 
        'width': '200'
    },
    {   
        'key': 'domains', 
        'label': 'Domains', 
        'sort': true, 
        'width': '300',
        render: (value) => `<span style="color: blue;">${value[0]}</span>`
    },
    {   
        'key': 'country', 
        'label': 'Country', 
        'sort': false, 
        'width': '200'
    },
    {   
        'key': 'name', 
        'label': 'Name', 
        'sort': true, 
        'width': '600'
    },
    {   
        'key': 'state-province',
        'label': 'State Province', 
        'sort': true, 
        'width': '200'
    },
    {   
        'key': 'web_pages',
        'label': 'Web Pages', 
        'sort': true, 
        'width': '500',
        render: (value) => `<span style="color: blue;">${value[0]}</span>`
    },
];