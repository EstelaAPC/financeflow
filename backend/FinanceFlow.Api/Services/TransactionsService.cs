using FinanceFlow.Api.DTOs;
using FinanceFlow.Api.Models;
using FinanceFlow.Api.Repositories;

namespace FinanceFlow.Api.Services;

public class TransactionsService
{
    private readonly ITransactionRepository _transactionRepository;

    public TransactionsService(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public List<Transaction> GetTransactions()
    {
        return _transactionRepository.GetAll();
    }

    public Transaction? GetTransactionById(Guid id)
    {
        return _transactionRepository.GetById(id);
    }

    public Transaction CreateTransaction(CreateTransactionRequest request)
    {
        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            Description = request.Description,
            Amount = request.Amount,
            Date = request.Date,
            Category = request.Category,
            Type = request.Type,
            Source = request.Source
        };

        return _transactionRepository.Add(transaction);
    }

    public bool DeleteTransaction(Guid id)
    {
        var transaction = _transactionRepository.GetById(id);

        if (transaction is null)
        {
            return false;
        }

        _transactionRepository.Delete(id);

        return true;
    }

    public bool UpdateTransaction(Guid id, CreateTransactionRequest request)
    {
        var transaction = _transactionRepository.GetById(id);

        if (transaction is null)
        {
            return false;
        }

        transaction.Description = request.Description;
        transaction.Amount = request.Amount;
        transaction.Date = request.Date;
        transaction.Category = request.Category;
        transaction.Type = request.Type;
        transaction.Source = request.Source;

        _transactionRepository.Update(transaction);

        return true;
    }
}