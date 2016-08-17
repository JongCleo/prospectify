# prospectify
Streamlining the process of finding a prospect from a company.
It will take input type CSV and upload a processed CSV in the authed user's Google Drive.
Detailed instructions provided on the landing page: http://se-prospectify.herokuapp.com/

### Set Up

1. Ensure that Node.js v 5.7.0 or later is installed
2. Clone the repository
3. Run `npm install`
4. `node app` will start the server, at http://localhost:8080/

### Developers

- The login uses Google OAuth. Client secret file will be given upon request from @steverino
- Calls to Email Hunter's API require the EMAIL_KEY and BlockSpring's API require the BING_KEY. Env variables are set in Heroku and should be saved locally in a file titled "config.json"

- On file upload, the app makes an AJAX POST to the server with the file. The server is listening for inbound files to process.
- Upon receiving a file, the app makes an http request for a Google query that is likely to returned the linkedin profiles of contacts at the inputted company.
- It then scrapes the HTML for the contact information of the best match.
- It will call the BlockSpring api to grab the domain of the company. Wappalyzer API is dependant on this information, and will not be requested if the BlockSpring GET is unsuccessful.
- Email Hunter and Wappalyzer calls to grab the contact's email and company website's current e-commerce platform, respectively.
- The contact will be written to an array and the app will move onto the next entry in the .csv

### Heroku Debugging
 run command: `heroku logs --app se-prospectify -t`
 admin: https://dashboard-classic.heroku.com/apps/se-prospectify/
 Usually you just need to restart the dynos.

### Questions
ping @steverino for any questions/troubleshooting help

### Issues
 Future considerations would be to add in workers/child processes to alleviate the r14 memory error that occurs when we run 500+ contacts through it. Open to suggestions for best practices.
