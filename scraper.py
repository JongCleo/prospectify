import csv
import urllib
import webbrowser
import pandas as pd

"""
this opens the file

company = open('test.csv')
csv_company = csv.reader(company)
for row in csv_company
        content = list(row[0] for i in included_cols)
"""

df = pd.read_csv('test.csv')
saved_column = df.Company_name
names = df.Company_name
"""
url = 'https://www.linkedin.com/vsearch/f?type=all&keywords=ecommerce+at+') first_id
A = json.load(urllib.urlopen(url))
print A

for (element in content){

    url = linkedin + element
    body = getHTML(url)
    title = body.selectElement('jobtitle')

}
"""
