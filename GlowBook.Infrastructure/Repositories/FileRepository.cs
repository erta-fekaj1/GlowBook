using System.Linq.Expressions;
using GlowBook.Core.Interfaces;

namespace GlowBook.Infrastructure.Repositories;

public class FileRepository<T> : IRepository<T> where T : class
{
    private readonly string _filePath;
    private List<T> _data;
    
    public FileRepository(string filePath)
    {
        _filePath = filePath;
        LoadData();
    }
    
    private void LoadData()
    {
        // Kodi yt ekzistues për të lexuar CSV
        // ...
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
        // Implementimi yt ekzistues
        return _data.FirstOrDefault(x => (int)x.GetType().GetProperty("Id").GetValue(x) == id);
    }
    
    public void Add(T entity)
    {
        // Implementimi yt ekzistues
        _data.Add(entity);
        SaveData();
    }
    
    public void Update(T entity)
    {
        // Implementimi yt ekzistues
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
        // Kodi yt ekzistues për të ruajtur në CSV
        // ...
    }
}