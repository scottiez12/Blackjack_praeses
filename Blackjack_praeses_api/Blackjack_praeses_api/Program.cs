using Blackjack_praeses_api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// Register game services
builder.Services.AddSingleton<GameService>();
builder.Services.AddSingleton<GameManager>();

// Add AutoMapper (v13+ has built-in DI support)
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddMaps(typeof(Program).Assembly);
});


// CORs for client
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("BlackjackClient", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Only redirect to HTTPS in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

//dont forget CORs!
app.UseCors("BlackjackClient");

app.UseAuthorization();

app.MapControllers();

app.Run();
