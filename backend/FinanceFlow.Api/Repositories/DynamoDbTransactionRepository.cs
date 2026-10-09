
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using FinanceFlow.Api.Models;
using Amazon.DynamoDBv2.Model;
using System.Globalization;

namespace FinanceFlow.Api.Repositories;

public class DynamoDbTransactionRepository : ITransactionRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly string _tableName;

    public DynamoDbTransactionRepository(
        IAmazonDynamoDB dynamoDb,
        IConfiguration configuration)
    {
        _dynamoDb = dynamoDb;
        _tableName = configuration["Database:TableName"]
            ?? "FinanceFlowTransactions";
    }

    public List<Transaction> GetAll()
    {
        var response = _dynamoDb.ScanAsync(new ScanRequest
        {
            TableName = _tableName
        }).GetAwaiter().GetResult();

        return response.Items.Select(item => new Transaction
        {
            Id = Guid.Parse(item["Id"].S),
            Description = item["Description"].S,
            Amount = decimal.Parse(
                item["Amount"].N,
                CultureInfo.InvariantCulture
            ),
            Date = DateTime.Parse(
                item["Date"].S,
                CultureInfo.InvariantCulture
            ),
            Category = item["Category"].S,
            Type = Enum.Parse<TransactionType>(item["Type"].S),
            Source = item.TryGetValue("Source", out var source)
                ? source.S
                : null
        }).ToList();
    }

    public Transaction Add(Transaction transaction)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["Id"] = new AttributeValue { S = transaction.Id.ToString() },
            ["Description"] = new AttributeValue { S = transaction.Description },
            ["Amount"] = new AttributeValue
            {
                N = transaction.Amount.ToString(CultureInfo.InvariantCulture)
            },
            ["Date"] = new AttributeValue
            {
                S = transaction.Date.ToString("O", CultureInfo.InvariantCulture)
            },
            ["Category"] = new AttributeValue { S = transaction.Category },
            ["Type"] = new AttributeValue { S = transaction.Type.ToString() }
        };

        if (transaction.Source is not null)
        {
            item["Source"] = new AttributeValue { S = transaction.Source };
        }

        _dynamoDb.PutItemAsync(new PutItemRequest
        {
            TableName = _tableName,
            Item = item
        }).GetAwaiter().GetResult();

        return transaction;
    }


    public Transaction? GetById(Guid id)
    {
        var response = _dynamoDb.GetItemAsync(new GetItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["Id"] = new AttributeValue { S = id.ToString() }
            }
        }).GetAwaiter().GetResult();

        if (response.Item is null || response.Item.Count == 0)
        {
            return null;
        }

        var item = response.Item;

        return new Transaction
        {
            Id = Guid.Parse(item["Id"].S),
            Description = item["Description"].S,
            Amount = decimal.Parse(item["Amount"].N, CultureInfo.InvariantCulture),
            Date = DateTime.Parse(item["Date"].S, CultureInfo.InvariantCulture),
            Category = item["Category"].S,
            Type = Enum.Parse<TransactionType>(item["Type"].S),
            Source = item.TryGetValue("Source", out var source)
                ? source.S
                : null
        };
    }


    public void Delete(Guid id)
    {
        _dynamoDb.DeleteItemAsync(new DeleteItemRequest
        {
            TableName = _tableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["Id"] = new AttributeValue { S = id.ToString() }
            }
        }).GetAwaiter().GetResult();
    }

    public void Update(Transaction transaction)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["Id"] = new AttributeValue { S = transaction.Id.ToString() },
            ["Description"] = new AttributeValue { S = transaction.Description },
            ["Amount"] = new AttributeValue
            {
                N = transaction.Amount.ToString(CultureInfo.InvariantCulture)
            },
            ["Date"] = new AttributeValue
            {
                S = transaction.Date.ToString("O", CultureInfo.InvariantCulture)
            },
            ["Category"] = new AttributeValue { S = transaction.Category },
            ["Type"] = new AttributeValue { S = transaction.Type.ToString() }
        };

        if (transaction.Source is not null)
        {
            item["Source"] = new AttributeValue { S = transaction.Source };
        }

        _dynamoDb.PutItemAsync(new PutItemRequest
        {
            TableName = _tableName,
            Item = item
        }).GetAwaiter().GetResult();
    }
}
