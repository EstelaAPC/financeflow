namespace FinanceFlow.Api.Models;

public class Transaction
{
    public Guid Id { get; set; }

    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string Category { get; set; } = string.Empty;

    public TransactionType Type { get; set; }

    public string? Source { get; set; }
}

public enum TransactionType
{
    Income,
    Expense
}