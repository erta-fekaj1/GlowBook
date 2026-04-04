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
        try
        {
            if (!File.Exists(_filePath))
            {
                Console.WriteLine($"⚠️  File nuk u gjet: {_filePath}");
                Console.WriteLine($"✅ Po krijoj file të ri...");
                var directory = Path.GetDirectoryName(_filePath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                    Directory.CreateDirectory(directory);
                File.WriteAllText(_filePath, string.Empty);
                return;
            }

            var lines = File.ReadAllLines(_filePath);
            if (lines.Length <= 1)
            {
                Console.WriteLine($"ℹ️  File është bosh: {_filePath}");
                return;
            }

            var headers    = lines[0].Split(',');
            var properties = typeof(T).GetProperties();

            for (int i = 1; i < lines.Length; i++)
            {
                if (string.IsNullOrWhiteSpace(lines[i]))
                    continue;

                try
                {
                    var values = lines[i].Split(',');
                    var obj    = Activator.CreateInstance<T>();

                    for (int j = 0; j < headers.Length && j < values.Length; j++)
                    {
                        var prop = properties.FirstOrDefault(p => p.Name == headers[j]);
                        if (prop == null || string.IsNullOrEmpty(values[j]))
                            continue;

                        try
                        {
                            var targetType = Nullable.GetUnderlyingType(prop.PropertyType)
                                             ?? prop.PropertyType;
                            var value = Convert.ChangeType(values[j], targetType);
                            prop.SetValue(obj, value);
                        }
                        catch
                        {
                            // Nëse konvertimi dështon, lëre si default
                        }
                    }

                    _data.Add(obj);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️  Gabim në leximin e rreshtit {i}: {ex.Message}");
                }
            }
        }
        catch (UnauthorizedAccessException)
        {
            Console.WriteLine($"❌ Nuk keni leje për të lexuar: {_filePath}");
        }
        catch (IOException ex)
        {
            Console.WriteLine($"❌ Gabim I/O gjatë leximit: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Gabim i papritur: {ex.Message}");
        }
    }

    public IEnumerable<T> GetAll() => _data;

    public IEnumerable<T> Find(Expression<Func<T, bool>> predicate)
    {
        try
        {
            return _data.Where(predicate.Compile());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Gabim gjatë kërkimit: {ex.Message}");
            return Enumerable.Empty<T>();
        }
    }

    public T GetById(int id)
    {
        try
        {
            var property = typeof(T).GetProperty("Id");
            if (property == null)
            {
                Console.WriteLine("⚠️  Entiteti nuk ka property 'Id'");
                return null;
            }

            return _data.FirstOrDefault(x =>
            {
                var value = property.GetValue(x);
                return value != null && (int)value == id;
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Gabim gjatë kërkimit sipas ID: {ex.Message}");
            return null;
        }
    }

    public void Add(T entity)
    {
        try
        {
            var idProperty = typeof(T).GetProperty("Id");
            if (idProperty != null)
            {
                var maxId = _data.Any()
                    ? _data.Max(x => (int)idProperty.GetValue(x))
                    : 0;
                idProperty.SetValue(entity, maxId + 1);
            }

            _data.Add(entity);
            SaveData();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Gabim gjatë shtimit: {ex.Message}");
            throw;
        }
    }

    public void Update(T entity)
    {
        try
        {
            SaveData();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Gabim gjatë përditësimit: {ex.Message}");
            throw;
        }
    }

    public void Delete(int id)
    {
        try
        {
            var entity = GetById(id);
            if (entity == null)
            {
                Console.WriteLine($"⚠️  Itemi me ID {id} nuk u gjet");
                return;
            }

            _data.Remove(entity);
            SaveData();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Gabim gjatë fshirjes: {ex.Message}");
            throw;
        }
    }

    private void SaveData()
    {
        try
        {
            var properties = typeof(T).GetProperties();
            var lines      = new List<string>();

            var header = string.Join(",", properties.Select(p => p.Name));
            lines.Add(header);

            foreach (var item in _data)
            {
                var values = properties.Select(p =>
                {
                    var value = p.GetValue(item);
                    return value?.ToString() ?? "";
                });
                lines.Add(string.Join(",", values));
            }

            var directory = Path.GetDirectoryName(_filePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                Directory.CreateDirectory(directory);

            File.WriteAllLines(_filePath, lines);
        }
        catch (UnauthorizedAccessException)
        {
            Console.WriteLine($"❌ Nuk keni leje për të shkruar në: {_filePath}");
        }
        catch (IOException ex)
        {
            Console.WriteLine($"❌ Gabim I/O gjatë shkrimit: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Gabim i papritur gjatë ruajtjes: {ex.Message}");
        }
    }
}