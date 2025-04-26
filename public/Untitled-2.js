// File: server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Sequelize imports
const sequelize = require('./database');
const Book = require('./models/Book');

const app = express();
const port = 3000;

// Database connection and model synchronization
sequelize.sync()
    .then(() => console.log('Database and tables created!'))
    .catch(err => console.error('Unable to create tables: ', err));

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// Book upload route
app.post('/upload-book', upload.single('bookImage'), async (req, res) => {
    try {
        const bookData = {
            id: Date.now().toString(),
            bookName: req.body.bookName,
            authorName: req.body.authorName,
            bookImage: req.file ? `/uploads/${req.file.filename}` : '',
            birthYear: req.body.birthYear,
            deathYear: req.body.deathYear,
            language: req.body.language,
            genre: req.body.genre,
            literaryMovement: req.body.literaryMovement,
            importantThemes: req.body.importantThemes,
            keyCharacters: req.body.keyCharacters,
            bookSummary: req.body.bookSummary,
            youtubeLink: req.body.youtubeLink,
            bookLink: req.body.bookLink || ''
        };

        // Generate HTML content
        const htmlContent = generateBookPage(bookData);

        // Ensure books directory exists
        const booksDir = path.join(__dirname, 'public', 'books');
        if (!fs.existsSync(booksDir)){
            fs.mkdirSync(booksDir);
        }

        // Generate unique filename
        const filename = `book_${bookData.id}.html`;
        const outputPath = path.join(booksDir, filename);

        // Save generated HTML
        fs.writeFileSync(outputPath, htmlContent);

        // Add HTML link to book data
        bookData.htmlLink = `/books/${filename}`;

        // Create book in database
        await Book.create(bookData);

        // Respond with HTML content
        res.send(htmlContent);
    } catch (error) {
        console.error('Error uploading book:', error);
        res.status(500).send('Error uploading book');
    }
});

// Route to get all books
app.get('/books', async (req, res) => {
    try {
        const books = await Book.findAll();
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Unable to fetch books' });
    }
});

// Route to get a specific book by ID
app.get('/books/:id', async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ error: 'Book not found' });
        }
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ error: 'Unable to fetch book' });
    }
});


// Book page generation function
function generateBookPage(data) {
    const readBookButton = data.bookLink 
        ? `<a href="${data.bookLink}" target="_blank" class="read-btn">Read Book</a>` 
        : '';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo&display=swap" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="/icons/font/flaticon.css">
    <title>Browsing page</title>
    <style type="text/css">
        .jumbotron {
            background-image: url("https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
            color:floralwhite;
            background-size: cover;
        }
        #advanced-form {
            display: none;
        }

        #header {
            font-family:'Nanum Myeongjo', serif;
        }

        .container_img {
          position: relative;
          width: 100%;
        }

        .image {
          opacity: 1;
          display: block;
          width: 100%;
          height: auto;
          transition: .5s ease;
          backface-visibility: hidden;
        }

        .container_img:hover .image {
          opacity: 0.5;
        }

        iframe{
          padding: 1em;
        }

        #iframe_container{
          margin-top: 2em;
          display: flex;
          justify-content: center;
        }

         /* New CSS for Read Button */
         .read-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-align: center;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.3s ease;
        }

        .read-btn:hover {
            background-color: #0056b3;
            color: white;
            text-decoration: none;
        }

        .navbar {
            background-color: rgba(0,0,0,0.7);
            font-family: 'Nanum Myeongjo', serif;
        }

        .navbar-brand, .navbar-nav .nav-link {
            color: floralwhite !important;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark">
        <a class="navbar-brand" href="/">THE MULTIMEDIA STORE</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ml-auto">
                <li class="nav-item">
                    <a class="nav-link" href="/index.html">Home</a>
                </li>
                <li class="nav-item" id="loginNavItem">
                    <a class="nav-link" href="/login.html">Login</a>
                </li>
                <li class="nav-item" id="registerNavItem">
                    <a class="nav-link" href="/register.html">Register</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/contact.html">Contact</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/about.html">About me</a>
                </li>
                <li class="nav-item" id="logoutNavItem" style="display:none;">
                    <a class="nav-link" href="#" onclick="logout()">Logout</a>
                </li>
            </ul>
        </div>
    </nav>

    <div class="jumbotron">
    <br><br>
     <div id="header">
      <h1 class=display-3 style="text-align:center;"><strong>THE MULTIMEDIA STORE</strong></h1>
      <p class="lead" style="text-align:center;"><strong>Unlock the power of multimedia—innovation, quality, and creativity in one place!</strong></p>
  </div>
    </div>

    <div class="container">
    <div class="text-center">
      <h3 class="my-5">${data.bookName}</h3>
       
      <img src="${data.bookImage}" class="rounded mb-5" alt="${data.bookName} Book Cover" usemap="#book_map">
      <map id="book_map" name="book_map">
        <area shape="poly" coords="300, 471, 360, 437, 382, 472, 383, 563, 370, 599, 296, 473" href="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Book_icon.svg/220px-Book_icon.svg.png" target="_blank" alt="Book Icon" title="Book Icon">
      </map>
      ${readBookButton}
    </div>

    <table class="table">
      <thead>
        <tr>
          <th scope="col">Author</th>
          <td>${data.authorName}</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Birth/Death</th>
          <td>${data.birthYear} - ${data.deathYear}</td>
        </tr>
        <tr>
          <th scope="row">Language</th>
          <td>${data.language}</td>
        </tr>
        <tr>
          <th scope="row">Genre</th>
          <td>${data.genre}</td>
        </tr>
        <tr>
          <th scope="row">Literary Movement</th>
          <td>${data.literaryMovement}</td>
        </tr>
        <tr>
          <th scope="row">Important Themes</th>
          <td>${data.importantThemes}</td>
        </tr>
        <tr>
          <th scope="row">Key Characters</th>
          <td>${data.keyCharacters}</td>
        </tr>
      </tbody>
    </table>

    ${data.bookSummary.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}

    <div id="iframe_container">
        <iframe width="560" height="315" src="${data.youtubeLink}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>

    <br>
    <br>
    </div>
    </div>
    <br><br><hr>
    <div class="container">
        <!-- Footer -->
        <footer class="page-footer font-small pt-4">
          <div class="container-fluid text-center text-md-left">
            <div class="row justify-content-around">
              <div class="col-md-6 mt-md-0 mt-3">
              </div>
            </div>
          </div>
          <div class="footer-copyright text-center py-3"><p>&copy; 2025 THE MULTIMEDIA STORE.</p></div>
        </footer>
    </div>

    <script>
    // Check authentication status when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        checkAuth();
    });

    function checkAuth() {
        // Get authentication data from localStorage
        const token = localStorage.getItem('userToken');
        
        if (token) {
            // User is logged in
            // Hide login and register links
            document.getElementById('loginNavItem').style.display = 'none';
            document.getElementById('registerNavItem').style.display = 'none';
            // Show logout link
            document.getElementById('logoutNavItem').style.display = 'block';
        } else {
            // User is not logged in
            // Show login and register links
            document.getElementById('loginNavItem').style.display = 'block';
            document.getElementById('registerNavItem').style.display = 'block';
            // Hide logout link
            document.getElementById('logoutNavItem').style.display = 'none';
        }
    }
        
    // Function to handle logout
    function logout() {
        // Clear user data from localStorage
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        
        // Update navigation after logout
        checkAuth();
        
        // Redirect to home page
        window.location.href = 'index.html';
    }
        
    // Add this function to show login message
    function showLoginMessage(event) {
        event.preventDefault();
        alert('Please log in first to view book details.');
        // Optionally redirect to login page after a short delay
        setTimeout(function() {
            window.location.href = 'login.html';
        }, 1000);
    }
    </script>

    <!-- Bootstrap JS and dependencies -->
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.3/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"></script>
</body>
</html>
    `;
}