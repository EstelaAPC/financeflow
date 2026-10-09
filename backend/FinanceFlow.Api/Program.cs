
using FinanceFlow.Api.Repositories;
using FinanceFlow.Api.Services;
using System.Text.Json.Serialization;
using Amazon;
using Amazon.DynamoDBv2;
using Amazon.Lambda.AspNetCoreServer.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FinanceFlowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "http://127.0.0.1:4200"
            )
            .WithHeaders("Content-Type")
            .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    });
});

builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

var awsRegion = builder.Configuration["AWS:Region"] ?? "sa-east-1";

builder.Services.AddSingleton<IAmazonDynamoDB>(_ =>
    new AmazonDynamoDBClient(RegionEndpoint.GetBySystemName(awsRegion))
);

var useDynamoDb = builder.Configuration.GetValue<bool>("Database:UseDynamoDb");

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter()
        );
    });

builder.Services.AddScoped<TransactionsService>();

if (useDynamoDb)
{
    builder.Services.AddScoped<ITransactionRepository, DynamoDbTransactionRepository>();
}
else
{
    builder.Services.AddSingleton<ITransactionRepository, TransactionRepository>();
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "FinanceFlow.Api v1"
        );
    });
}

app.UseHttpsRedirection();
app.UseCors("FinanceFlowFrontend");

app.MapControllers();

app.Run();
