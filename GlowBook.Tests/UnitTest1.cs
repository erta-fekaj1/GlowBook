using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using GlowBook.Application.Services;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;
using Xunit;

namespace GlowBook.Tests;

// ============================================================
// MOCK REPOSITORY - për teste pa file system
// ============================================================
public class MockServiceRepository : IRepository<Service>
{
    private List<Service> _data;

    public MockServiceRepository(List<Service> initialData = null)
    {
        _data = initialData ?? new List<Service>();
    }

    public IEnumerable<Service> GetAll() => _data;

    public Service GetById(int id) => _data.FirstOrDefault(s => s.Id == id);

    public void Add(Service entity)
    {
        entity.Id = _data.Any() ? _data.Max(s => s.Id) + 1 : 1;
        _data.Add(entity);
    }

    public void Update(Service entity)
    {
        var index = _data.FindIndex(s => s.Id == entity.Id);
        if (index >= 0) _data[index] = entity;
    }

    public void Delete(int id)
    {
        var entity = GetById(id);
        if (entity != null) _data.Remove(entity);
    }

    public IEnumerable<Service> Find(System.Linq.Expressions.Expression<Func<Service, bool>> predicate)
        => _data.Where(predicate.Compile());
}

// ============================================================
// TESTE PËR SEARCHBYNAME
// ============================================================
public class SearchTests
{
    private ServiceService CreateService(List<Service> data = null)
    {
        var repo = new MockServiceRepository(data ?? new List<Service>
        {
            new Service { Id = 1, Name = "Manikyr Klasik", Price = 15, DurationMinutes = 30 },
            new Service { Id = 2, Name = "Pedikyr Deluxe", Price = 25, DurationMinutes = 60 },
            new Service { Id = 3, Name = "Manikyr Gel",    Price = 20, DurationMinutes = 45 },
            new Service { Id = 4, Name = "Nail Art",       Price = 35, DurationMinutes = 90 }
        });
        return new ServiceService(repo);
    }

    [Fact]
    public void SearchByName_ExistingName_ReturnsResults()
    {
        var service = CreateService();
        var result = service.SearchByName("Manikyr");
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void SearchByName_NonExistingName_ReturnsEmpty()
    {
        var service = CreateService();
        var result = service.SearchByName("Nuk-Ekziston");
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public void SearchByName_EmptyString_ReturnsAll()
    {
        var service = CreateService();
        var result = service.SearchByName("");
        Assert.Equal(4, result.Count);
    }

    [Fact]
    public void SearchByName_CaseInsensitive_ReturnsResults()
    {
        var service = CreateService();
        var result = service.SearchByName("manikyr");
        Assert.Equal(2, result.Count);
    }
}

// ============================================================
// TESTE PËR FILTRIM SIPAS ÇMIMIT
// ============================================================
public class FilterTests
{
    private ServiceService CreateService()
    {
        var repo = new MockServiceRepository(new List<Service>
        {
            new Service { Id = 1, Name = "Manikyr Klasik", Price = 15, DurationMinutes = 30 },
            new Service { Id = 2, Name = "Pedikyr Deluxe", Price = 25, DurationMinutes = 60 },
            new Service { Id = 3, Name = "Manikyr Gel",    Price = 20, DurationMinutes = 45 },
            new Service { Id = 4, Name = "Nail Art",       Price = 35, DurationMinutes = 90 }
        });
        return new ServiceService(repo);
    }

    [Fact]
    public void FilterByPrice_MinPrice_ReturnsCorrectResults()
    {
        var service = CreateService();
        var result = service.FilterByPrice(minPrice: 20);
        Assert.Equal(3, result.Count);
        Assert.All(result, s => Assert.True(s.Price >= 20));
    }

    [Fact]
    public void FilterByPrice_MaxPrice_ReturnsCorrectResults()
    {
        var service = CreateService();
        var result = service.FilterByPrice(maxPrice: 20);
        Assert.Equal(2, result.Count);
        Assert.All(result, s => Assert.True(s.Price <= 20));
    }

    [Fact]
    public void FilterByPrice_MinAndMax_ReturnsCorrectResults()
    {
        var service = CreateService();
        var result = service.FilterByPrice(minPrice: 20, maxPrice: 30);
        Assert.Equal(2, result.Count);
    }
}

// ============================================================
// TESTE PËR STATISTIKA
// ============================================================
public class StatisticsTests
{
    private ServiceService CreateService()
    {
        var repo = new MockServiceRepository(new List<Service>
        {
            new Service { Id = 1, Name = "Manikyr Klasik", Price = 15, DurationMinutes = 30 },
            new Service { Id = 2, Name = "Pedikyr Deluxe", Price = 25, DurationMinutes = 60 },
            new Service { Id = 3, Name = "Manikyr Gel",    Price = 20, DurationMinutes = 45 },
            new Service { Id = 4, Name = "Nail Art",       Price = 35, DurationMinutes = 90 }
        });
        return new ServiceService(repo);
    }

    [Fact]
    public void GetStatistics_ReturnsCorrectTotal()
    {
        var service = CreateService();
        var stats = service.GetStatistics();
        Assert.Equal(4, stats.TotalServices);
    }

    [Fact]
    public void GetStatistics_ReturnsCorrectMaxPrice()
    {
        var service = CreateService();
        var stats = service.GetStatistics();
        Assert.Equal(35, stats.MaxPrice);
    }

    [Fact]
    public void GetStatistics_ReturnsCorrectMinPrice()
    {
        var service = CreateService();
        var stats = service.GetStatistics();
        Assert.Equal(15, stats.MinPrice);
    }

    [Fact]
    public void GetStatistics_ReturnsCorrectAverage()
    {
        var service = CreateService();
        var stats = service.GetStatistics();
        Assert.Equal(23.75m, stats.AveragePrice);
    }

    [Fact]
    public void GetStatistics_EmptyRepository_ReturnsZeros()
    {
        var repo = new MockServiceRepository(new List<Service>());
        var service = new ServiceService(repo);
        var stats = service.GetStatistics();
        Assert.Equal(0, stats.TotalServices);
        Assert.Equal(0, stats.AveragePrice);
    }
}

// ============================================================
// TESTE PËR CRUD ME VALIDIM
// ============================================================
public class CrudTests
{
    private ServiceService CreateService()
    {
        var repo = new MockServiceRepository(new List<Service>
        {
            new Service { Id = 1, Name = "Manikyr Klasik", Price = 15, DurationMinutes = 30 }
        });
        return new ServiceService(repo);
    }

    [Fact]
    public void AddService_ValidData_ReturnsService()
    {
        var service = CreateService();
        var result = service.Add("Pedikyr", "Përshkrim", 20, 60);
        Assert.NotNull(result);
        Assert.Equal("Pedikyr", result.Name);
    }

    [Fact]
    public void AddService_EmptyName_ThrowsException()
    {
        var service = CreateService();
        Assert.Throws<ArgumentException>(() => service.Add("", "Përshkrim", 20, 60));
    }

    [Fact]
    public void AddService_NegativePrice_ThrowsException()
    {
        var service = CreateService();
        Assert.Throws<ArgumentException>(() => service.Add("Pedikyr", "Përshkrim", -5, 60));
    }

    [Fact]
    public void AddService_DuplicateName_ThrowsException()
    {
        var service = CreateService();
        Assert.Throws<InvalidOperationException>(() =>
            service.Add("Manikyr Klasik", "Përshkrim", 20, 60));
    }

    [Fact]
    public void GetById_NonExistingId_ThrowsException()
    {
        var service = CreateService();
        Assert.Throws<KeyNotFoundException>(() => service.GetById(999));
    }

    [Fact]
    public void GetById_InvalidId_ThrowsException()
    {
        var service = CreateService();
        Assert.Throws<ArgumentException>(() => service.GetById(-1));
    }

    [Fact]
    public void DeleteService_ExistingId_ReturnsTrue()
    {
        var service = CreateService();
        var result = service.Delete(1);
        Assert.True(result);
    }
}