# Hope Backend

A Meteor.js based backend service providing API endpoints and business logic for the Hope application.

## 🚀 Features

- RESTful API endpoints
- File server capabilities
- Cron job scheduling
- Admin management system
- Integration with various services (Firebase, Redis, etc.)

## 📋 Prerequisites

- Node.js (v14 or higher)
- Meteor.js
- MongoDB
- Redis
- Firebase Admin SDK credentials

## 🔧 Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd hope-backend
```

2. Install dependencies:
```bash
meteor npm install
```

3. Configure environment:
- Copy `settings.json.example` to `settings.json`
- Update the configuration with your credentials

## ⚙️ Configuration

The project uses the following configuration files:
- `settings.json`: Main configuration file
- Environment variables for sensitive data

## 🏃‍♂️ Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📁 Project Structure

```
hope-backend/
├── imports/
│   ├── api.js           # API routes and endpoints
│   ├── features/        # Feature-specific modules
│   ├── fileServer/      # File handling services
│   ├── cron/           # Scheduled tasks
│   └── initAdmin.js    # Admin initialization
├── server/
│   └── main.js         # Server entry point
└── .meteor/            # Meteor.js configuration
```

## 🔌 Dependencies

Key dependencies include:
- Meteor.js
- Firebase Admin
- Redis
- Bull (Job queue)
- BPMN Engine
- Various utility libraries

## 📝 API Documentation

API endpoints are defined in `imports/api.js`. For detailed API documentation, please refer to the API documentation in the project wiki.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For any queries or support, please contact the development team.