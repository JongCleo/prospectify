# prospectify
Streamlining the process of finding a contact from a prospect company.

Usage Steps
1. Download node.js
2. cd into prospectify
3. Run 'npm install'
4. Drag and drop your csv file into the prospectify folder
5. Open "app.js" and change the var fileName to equal the name of the .csv file you want to process*
6. run node app
7. after everything is processed, you will probably a message in the terminal saying "go to this link:..." Copy and paste the link into the browser and follow the instructions
8. Check your google drive. The end file will be there.

*Note that company names in the csv file must be located on the leftmost column of the sheet. The first cell in this column must be the header
ie. if I had a file I wanted to process title "test.csv" I would assign fileName = "test"
