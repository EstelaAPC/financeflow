using FinanceFlow.Api.Models;

namespace FinanceFlow.Api.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly List<Transaction> _transactions = new();

    public List<Transaction> GetAll()
    {
        return _transactions;
    }

    public Transaction Add(Transaction transaction)
    {
        _transactions.Add(transaction);

        return transaction;
    }

    public Transaction? GetById(Guid id)
    {
        return _transactions.FirstOrDefault(t => t.Id == id);
    }

    public void Delete(Guid id)
    {
        var transaction = _transactions.FirstOrDefault(t => t.Id == id);

        if (transaction is not null)
        {
            _transactions.Remove(transaction);
        }
    }

    public void Update(Transaction transaction)
    {
        var existingTransaction = _transactions.FirstOrDefault(
            t => t.Id == transaction.Id
        );

        if (existingTransaction is null)
        {
            return;
        }

        existingTransaction.Description = transaction.Description;
        existingTransaction.Amount = transaction.Amount;
        existingTransaction.Date = transaction.Date;
        existingTransaction.Category = transaction.Category;
        existingTransaction.Type = transaction.Type;
        existingTransaction.Source = transaction.Source;
    }
}