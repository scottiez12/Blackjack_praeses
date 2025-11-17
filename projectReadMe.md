Overall:
It was pretty easy to get into the weeds with the web of "if" cases, especially when I started wrenching on split hands. Many many years ago I built a blackjack game in school but it's kind of funny how impossible it seemed then versus now. The general flow was writing, testing, some google-fu and letting Copilot/intellisense do the redundancy lifting and some refactoring. The front end was actually pretty fun; I haven't done much of that in a while. As usual, I was surprised about what I learned along the way in the building/refactoring process; it's pretty wild how as the years have gone by .NET/C# introduces features or new ways of doing things or I come across something that I'd never heard of.

- Approx. dev time ~18.5 hours for code/cleanup/refactor/documentation/testing. Pretty wild what you can get done with modern tooling and a gameplan these days!

Architecture:

- .NET Core Web API
  - AutoMapper
- React frontend
  - Vite
  - Tailwind
  - Axios

Tooling:

- VS Code
- VS2022
- Github
- Copilot

General Game Features:

- Betting
- Soft 17 handling
- Splitting
- Doubling
- Deck shuffling
- Multiple decks
  - Shoe reshuffles @ 20% remaining
- Multiple players
  - CPU players following general blackjack strategy
- Table/dealing position and order
- Game state and hand state

Persistence:

- In-memory session-based - Could relatively easily be changed to a database; the mapping for entities and DTOs are already there.

Things I would have like to have done/added/improved/etc.:

- Blackjack-relevant
  - Insurance
  - Surrender
- Persistence - I mentioned this above but it would be nice to have a database to store game sessions and player balances, even if it's just in a local JSON file. Sure you could use just some local/session storage but that's a lot of moving pieces, but it definitely "fails" if your browser window goes down or refreshes.
- Better UI - It works and has a bit of polish but it still looks like a "project", not a "game" if that makes any sense. Generally I use shadcn.ui and MUI for components but it was faster to do it myself with Tailwind and let Copilot do a little bit of redundancy cleanup. In general I'd break this down into more components and make it more modular but that really wasn't a priority for this project. Same with responsiveness/accessibility/browser compatibility.
- CPU Players - I feel like there's more logical or elegant ways of doing this. A case study on the written logic versus wiring it up to a machine learning model would be interesting.
- Testing Suite - I leaned heavy on Copilot to write tests for the project but it's definitely not my strong suit. I'm sure there's a lot of room for improvement there, and honestly it was more of a refresher of my own knowledge than anything.
- CI/CD - I didn't set this up but it would be nice to have a pipeline for building and deploying the project.
- HTTPs - More or less just winged it with this to get it all working without too much build thought but it's something that realistically needs to be addressed.

Build/Launch Instructions:

- Clone the repo
- Open the API solution in Visual Studio (2022 is what I used for the build)
- Run the API project
- Open a terminal in the blackjack_praeses_client folder in VS Code or your preferred editor
- Run "npm install"
- Run "npm run dev"
- When prompted in the terminal, open the client in the browser (chrome, localhost:5173)
- Have fun!
