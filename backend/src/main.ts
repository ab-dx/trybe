import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: "*",
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
		}),
	);

	const port = process.env.PORT || 3000;
	await app.listen(port, "0.0.0.0");
	console.log(`Trybe API running on port ${port}`);
}
bootstrap();
