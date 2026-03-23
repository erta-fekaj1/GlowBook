using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.IO;
using GlowBook.Core.Interfaces;

namespace GlowBook.Infrastructure.Repositories;

public class FileRepository<T> : IRepository<T> where T : class
{
    private readonly string _filePath;
    private List<T> _data;
    
    public FileRepository(string filePath)
    {
        _filePath = filePath;
        _data = new List<T>();
        LoadData();
    }
    
    private void LoadData()
    {
        if (!File.Exists(_filePath))
            return;
        
        try
        {
            var lines = File.ReadAllLines(_filePath);
            if (lines.Length <= 1) return; // Vetëm header, pa të dhëna
            
            var headers = lines[0].Split(',');
            var properties = typeof(T).GetProperties();
            
            for (int i = 1; i < lines.Length; i++)
            {
                if (string.IsNullOrWhiteSpace(lines[i]))
                    continue;
                    
                var values = lines[i].Split(',');
                var obj = Activator.CreateInstance<T>();
                
                for (int j = 0; j < headers.Length && j < values.Length; j++)
                {
                    var prop = properties.FirstOrDefault(p => p.Name == headers[j]);
                    if (prop != null && !string.IsNullOrEmpty(values[j]))
                    {
                        try
                        {
                            var value = Convert.ChangeType(values[j], prop.PropertyType);
                            prop.SetValue(obj, value);
                        }
                        catch
                        {
                            // Nëse konvertimi dështon, lëre si null
                        }
                    }
                }
                
                _data.Add(obj);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading data from {_filePath}: {ex.Message}");
        }
    }
    
    public IEnumerable<T> GetAll()
    {
        return _data;
    }
    
    public IEnumerable<T> Find(Expression<Func<T, bool>> predicate)
    {
        return _data.Where(predicate.Compile());
    }
    
    public T GetById(int id)
    {
        var property = typeof(T).GetProperty("Id");
        if (property == null)
            return null;
            
        return _data.FirstOrDefault(x => 
        {
            var value = property.GetValue(x);
            return value != null && (int)value == id;
        });
    }
    
    public void Add(T entity)
    {
        // Gjej ID-në maksimale për ID të re
        var idProperty = typeof(T).GetProperty("Id");
        if (idProperty != null)
        {
            var maxId = _data.Any() ? _data.Max(x => (int)idProperty.GetValue(x)) : 0;
            idProperty.SetValue(entity, maxId + 1);
        }
        
        _data.Add(entity);
        SaveData();
    }
    
    public void Update(T entity)
    {
        SaveData();
    }
    
    public void Delete(int id)
    {
        var entity = GetById(id);
        if (entity != null)
        {
            _data.Remove(entity);
            SaveData();
        }
    }
    
    private void SaveData()
    {
        try
        {
            var properties = typeof(T).GetProperties();
            var lines = new List<string>();
            
            // Krijo header (emrat e propertive)
            var header = string.Join(",", properties.Select(p => p.Name));
            lines.Add(header);
            
            // Shto çdo rresht me vlerat
            foreach (var item in _data)
            {
                var values = properties.Select(p => 
                {
                    var value = p.GetValue(item);
                    return value?.ToString() ?? "";
                });
                var line = string.Join(",", values);
                lines.Add(line);
            }
            
            // Krijo direktorinë nëse nuk ekziston
            var directory = Path.GetDirectoryName(_filePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }
            
            // Shkruaj në file
            File.WriteAllLines(_filePath, lines);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving data to {_filePath}: {ex.Message}");
        }
    }
}