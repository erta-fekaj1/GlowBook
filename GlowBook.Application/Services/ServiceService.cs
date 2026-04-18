using System;
using System.Collections.Generic;
using System.Linq;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;

namespace GlowBook.Application.Services;

public class ServiceService
{
    private readonly IRepository<Service> _serviceRepository;

    public ServiceService(IRepository<Service> serviceRepository)
    {
        _serviceRepository = serviceRepository;
    }

    // ============================================================
    // 1. KËRKIM + FILTRIM
    // ============================================================

    /// <summary>
    /// Kërkon shërbime sipas emrit (case-insensitive)
    /// </summary>
    public List<Service> SearchByName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return _serviceRepository.GetAll().ToList();

        return _serviceRepository
            .GetAll()
            .Where(s => s.Name.Contains(name, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    /// <summary>
    /// Filtron shërbime sipas çmimit minimal dhe maksimal
    /// </summary>
    public List<Service> FilterByPrice(decimal? minPrice = null, decimal? maxPrice = null)
    {
        var services = _serviceRepository.GetAll();

        if (minPrice.HasValue)
            services = services.Where(s => s.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            services = services.Where(s => s.Price <= maxPrice.Value);

        return services.ToList();
    }

    /// <summary>
    /// Kërkim i kombinuar: emri + çmimi + kohëzgjatja
    /// </summary>
    public List<Service> Search(
        string? name = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        int? maxDuration = null)
    {
        var services = _serviceRepository.GetAll();

        if (!string.IsNullOrWhiteSpace(name))
            services = services.Where(s =>
                s.Name.Contains(name, StringComparison.OrdinalIgnoreCase));

        if (minPrice.HasValue)
            services = services.Where(s => s.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            services = services.Where(s => s.Price <= maxPrice.Value);

        if (maxDuration.HasValue)
            services = services.Where(s => s.DurationMinutes <= maxDuration.Value);

        return services.ToList();
    }

    // ============================================================
    // 2. STATISTIKA
    // ============================================================

    /// <summary>
    /// Kthen statistikat e plota të shërbimeve
    /// </summary>
    public ServiceStatistics GetStatistics()
    {
        var services = _serviceRepository.GetAll().ToList();

        if (!services.Any())
        {
            return new ServiceStatistics
            {
                TotalServices    = 0,
                TotalRevenue     = 0,
                AveragePrice     = 0,
                MaxPrice         = 0,
                MinPrice         = 0,
                AverageDuration  = 0,
                MostExpensive    = null,
                Cheapest         = null
            };
        }

        return new ServiceStatistics
        {
            TotalServices   = services.Count,
            TotalRevenue    = services.Sum(s => s.Price),
            AveragePrice    = Math.Round(services.Average(s => s.Price), 2),
            MaxPrice        = services.Max(s => s.Price),
            MinPrice        = services.Min(s => s.Price),
            AverageDuration = (int)services.Average(s => s.DurationMinutes),
            MostExpensive   = services.OrderByDescending(s => s.Price).First(),
            Cheapest        = services.OrderBy(s => s.Price).First()
        };
    }

    // ============================================================
    // 3. CRUD ME VALIDIM
    // ============================================================

    public Service GetById(int id)
    {
        if (id <= 0)
            throw new ArgumentException("ID duhet të jetë më e madhe se 0");

        var service = _serviceRepository.GetById(id);
        if (service == null)
            throw new KeyNotFoundException($"Shërbimi me ID {id} nuk u gjet");

        return service;
    }

    public List<Service> GetAll()
    {
        return _serviceRepository.GetAll().ToList();
    }

    public Service Add(string name, string description, decimal price, int durationMinutes)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Emri nuk mund të jetë bosh");

        if (price <= 0)
            throw new ArgumentException("Çmimi duhet të jetë më i madh se 0");

        if (durationMinutes <= 0)
            throw new ArgumentException("Kohëzgjatja duhet të jetë më e madhe se 0");

        var existing = _serviceRepository.GetAll()
            .Any(s => s.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

        if (existing)
            throw new InvalidOperationException($"Shërbimi '{name}' ekziston tashmë");

        var service = new Service
        {
            Name            = name,
            Description     = description,
            Price           = price,
            DurationMinutes = durationMinutes
        };

        _serviceRepository.Add(service);
        return service;
    }

    public Service Update(int id, string name, string description, decimal price, int durationMinutes)
    {
        var service = GetById(id);

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Emri nuk mund të jetë bosh");

        if (price <= 0)
            throw new ArgumentException("Çmimi duhet të jetë më i madh se 0");

        var duplicate = _serviceRepository.GetAll()
            .Any(s => s.Id != id &&
                      s.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

        if (duplicate)
            throw new InvalidOperationException($"Shërbimi '{name}' ekziston tashmë");

        service.Name            = name;
        service.Description     = description;
        service.Price           = price;
        service.DurationMinutes = durationMinutes;

        _serviceRepository.Update(service);
        return service;
    }

    public bool Delete(int id)
    {
        var service = GetById(id);
        _serviceRepository.Delete(id);
        return true;
    }
}

// ============================================================
// MODEL PËR STATISTIKA
// ============================================================
public class ServiceStatistics
{
    public int     TotalServices   { get; set; }
    public decimal TotalRevenue    { get; set; }
    public decimal AveragePrice    { get; set; }
    public decimal MaxPrice        { get; set; }
    public decimal MinPrice        { get; set; }
    public int     AverageDuration { get; set; }
    public Service? MostExpensive   { get; set; }
    public Service? Cheapest        { get; set; }
}