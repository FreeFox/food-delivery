import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as passport from 'passport';
const session = require('express-session');
const cookieParser = require('cookie-parser');

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableShutdownHooks();
    app.use(cookieParser());
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );
    app.enableCors();

    app.use(session({
        secret: process.env.SESSION_SECRET || 'keyboard cat',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24
        }
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    const port = process.env.PORT || 5000;
    await app.listen(port);
    console.log(`Server running on port ${port}`);
}

bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});